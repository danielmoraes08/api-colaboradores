const { lerColaboradores } = require("../db");

/**
 * Valida CPF: apenas dígitos, 11 caracteres.
 */
function cpfValido(cpf) {
  return /^\d{11}$/.test(cpf.replace(/[.\-]/g, ""));
}

/**
 * Normaliza CPF removendo pontos e traços.
 */
function normalizarCPF(cpf) {
  return cpf.replace(/[.\-]/g, "");
}

/**
 * Middleware de validação para o cadastro (POST).
 * Verifica campos obrigatórios, formato de e-mail, CPF e duplicidade.
 */
function validarCadastro(req, res, next) {
  const { nome, cargo, cpf, email } = req.body;
  const erros = [];

  // Campos obrigatórios
  if (!nome || nome.trim() === "") erros.push("O campo 'nome' é obrigatório.");
  if (!cargo || cargo.trim() === "") erros.push("O campo 'cargo' é obrigatório.");
  if (!cpf || cpf.trim() === "") erros.push("O campo 'cpf' é obrigatório.");
  if (!email || email.trim() === "") erros.push("O campo 'email' é obrigatório.");

  // Validações de formato
  if (email && !email.includes("@")) {
    erros.push("O campo 'email' deve conter '@'.");
  }

  if (cpf && !cpfValido(cpf)) {
    erros.push("O CPF deve conter exatamente 11 dígitos numéricos.");
  }

  if (erros.length > 0) {
    return res.status(400).json({ erro: "Dados inválidos.", detalhes: erros });
  }

  // Verificar CPF duplicado (apenas ativos ou inativos — CPF não pode repetir nunca)
  const cpfNormalizado = normalizarCPF(cpf);
  const colaboradores = lerColaboradores();
  const cpfExistente = colaboradores.find(
    (c) => c.cpf === cpfNormalizado
  );

  if (cpfExistente) {
    return res.status(409).json({
      erro: "CPF já cadastrado no sistema.",
      colaborador: cpfExistente.status === "Ativo" ? "Ativo" : "Inativo (soft delete)",
    });
  }

  // Normalizar CPF no body antes de passar adiante
  req.body.cpf = cpfNormalizado;
  next();
}

/**
 * Middleware de validação para atualização (PUT/PATCH).
 * Bloqueia alteração de CPF e valida campos permitidos.
 */
function validarAtualizacao(req, res, next) {
  const erros = [];

  if (req.body.cpf !== undefined) {
    return res.status(403).json({
      erro: "Não é permitido alterar o CPF de um colaborador cadastrado.",
    });
  }

  if (req.body.email !== undefined && !req.body.email.includes("@")) {
    erros.push("O campo 'email' deve conter '@'.");
  }

  if (req.body.nome !== undefined && req.body.nome.trim() === "") {
    erros.push("O campo 'nome' não pode ser vazio.");
  }

  if (req.body.cargo !== undefined && req.body.cargo.trim() === "") {
    erros.push("O campo 'cargo' não pode ser vazio.");
  }

  if (erros.length > 0) {
    return res.status(400).json({ erro: "Dados inválidos.", detalhes: erros });
  }

  next();
}

module.exports = { validarCadastro, validarAtualizacao, normalizarCPF };
