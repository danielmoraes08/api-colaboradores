const { lerColaboradores } = require("../db");

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Regex simples e pragmática para validar formato de e-mail.
 * Não cobre 100% do RFC 5322 (nenhuma regex curta cobre),
 * mas bloqueia os casos claramente inválidos como "@", "a@" ou "a@b".
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Verifica se o valor é uma string não vazia (depois de trim).
 */
function ehTextoPreenchido(valor) {
  return typeof valor === "string" && valor.trim() !== "";
}

/**
 * Valida CPF: precisa ser string, apenas dígitos após normalização,
 * 11 caracteres, não pode ser sequência de dígitos repetidos
 * (00000000000, 11111111111 etc., que são sempre inválidos)
 * e precisa ter dígitos verificadores corretos.
 */
function cpfValido(cpf) {
  if (typeof cpf !== "string") return false;

  const limpo = normalizarCPF(cpf);

  if (!/^\d{11}$/.test(limpo)) return false;
  if (/^(\d)\1{10}$/.test(limpo)) return false; // todos os dígitos iguais

  return digitosVerificadoresValidos(limpo);
}

/**
 * Calcula e confere os dois dígitos verificadores do CPF.
 */
function digitosVerificadoresValidos(cpf) {
  const calcularDigito = (base) => {
    let soma = 0;
    let peso = base.length + 1;
    for (const char of base) {
      soma += parseInt(char, 10) * peso;
      peso--;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const nove = cpf.slice(0, 9);
  const digito1 = calcularDigito(nove);
  const digito2 = calcularDigito(nove + digito1);

  return cpf === nove + digito1 + digito2;
}

/**
 * Normaliza CPF removendo pontos, traços e espaços.
 * Mantida tolerante a entrada não-string para não quebrar
 * quem já chama essa função (ex.: controller usa em parâmetro de rota).
 */
function normalizarCPF(cpf) {
  if (typeof cpf !== "string") return "";
  return cpf.replace(/[.\-\s]/g, "");
}

/**
 * Normaliza e-mail para minúsculas e sem espaços nas pontas,
 * só para fins de comparação/validação (não decide o que vai pro banco).
 */
function normalizarEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

// ─────────────────────────────────────────────
// Middleware de cadastro (POST)
// ─────────────────────────────────────────────

/**
 * Middleware de validação para o cadastro (POST).
 * Verifica campos obrigatórios, tipos, formato de e-mail, CPF e duplicidade.
 */
function validarCadastro(req, res, next) {
  const body = req.body || {};
  const { nome, cargo, cpf, email } = body;
  const erros = [];

  // Campos obrigatórios + tipo (evita 500 quando vem número, array, objeto etc.)
  if (!ehTextoPreenchido(nome)) {
    erros.push("O campo 'nome' é obrigatório e deve ser um texto não vazio.");
  } else if (nome.trim().length < 2) {
    erros.push("O campo 'nome' deve ter pelo menos 2 caracteres.");
  } else if (nome.trim().length > 120) {
    erros.push("O campo 'nome' deve ter no máximo 120 caracteres.");
  }

  if (!ehTextoPreenchido(cargo)) {
    erros.push("O campo 'cargo' é obrigatório e deve ser um texto não vazio.");
  } else if (cargo.trim().length > 80) {
    erros.push("O campo 'cargo' deve ter no máximo 80 caracteres.");
  }

  if (!ehTextoPreenchido(cpf)) {
    erros.push("O campo 'cpf' é obrigatório e deve ser um texto não vazio.");
  } else if (!cpfValido(cpf)) {
    erros.push("O CPF informado é inválido.");
  }

  if (!ehTextoPreenchido(email)) {
    erros.push("O campo 'email' é obrigatório e deve ser um texto não vazio.");
  } else if (!EMAIL_REGEX.test(email.trim())) {
    erros.push("O campo 'email' deve ser um e-mail válido (ex.: nome@dominio.com).");
  }

  if (erros.length > 0) {
    return res.status(400).json({ erro: "Dados inválidos.", detalhes: erros });
  }

  // Verificar CPF duplicado (ativos ou inativos — CPF não pode repetir nunca)
  const cpfNormalizado = normalizarCPF(cpf);
  const colaboradores = lerColaboradores();
  const cpfExistente = colaboradores.find((c) => c.cpf === cpfNormalizado);

  if (cpfExistente) {
    return res.status(409).json({
      erro: "CPF já cadastrado no sistema.",
      colaborador: cpfExistente.status === "Ativo" ? "Ativo" : "Inativo (soft delete)",
    });
  }

  // Normalizar CPF e e-mail no body antes de passar adiante
  req.body.cpf = cpfNormalizado;
  req.body.email = normalizarEmail(email);
  next();
}

// ─────────────────────────────────────────────
// Middleware de atualização (PUT/PATCH)
// ─────────────────────────────────────────────

/**
 * Middleware de validação para atualização (PUT/PATCH).
 * Bloqueia alteração de CPF e valida tipo/formato dos campos permitidos.
 */
function validarAtualizacao(req, res, next) {
  const body = req.body || {};
  const erros = [];

  if (body.cpf !== undefined) {
    const colaboradores = lerColaboradores();
    const colaboradorAtual = colaboradores.find((c) => c.id === req.params.id);

    if (!colaboradorAtual) {
      return res.status(404).json({ erro: "Colaborador não encontrado." });
    }

    if (normalizarCPF(body.cpf) !== colaboradorAtual.cpf) {
      return res.status(403).json({
        erro: "Não é permitido alterar o CPF de um colaborador cadastrado.",
      });
    }
    // CPF igual ao já cadastrado → apenas ignora, sem erro
  }

  if (body.email !== undefined) {
    if (typeof body.email !== "string" || !EMAIL_REGEX.test(body.email.trim())) {
      erros.push("O campo 'email' deve ser um e-mail válido (ex.: nome@dominio.com).");
    }
  }

  if (body.nome !== undefined) {
    if (typeof body.nome !== "string" || body.nome.trim() === "") {
      erros.push("O campo 'nome' não pode ser vazio.");
    } else if (body.nome.trim().length < 2) {
      erros.push("O campo 'nome' deve ter pelo menos 2 caracteres.");
    } else if (body.nome.trim().length > 120) {
      erros.push("O campo 'nome' deve ter no máximo 120 caracteres.");
    }
  }

  if (body.cargo !== undefined) {
    if (typeof body.cargo !== "string" || body.cargo.trim() === "") {
      erros.push("O campo 'cargo' não pode ser vazio.");
    } else if (body.cargo.trim().length > 80) {
      erros.push("O campo 'cargo' deve ter no máximo 80 caracteres.");
    }
  }

  if (erros.length > 0) {
    return res.status(400).json({ erro: "Dados inválidos.", detalhes: erros });
  }

  if (body.email !== undefined) {
    req.body.email = normalizarEmail(body.email);
  }

  next();
}

module.exports = { validarCadastro, validarAtualizacao, normalizarCPF };
