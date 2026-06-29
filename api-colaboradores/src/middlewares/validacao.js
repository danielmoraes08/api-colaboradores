const { lerColaboradores } = require("../db");

// TODO: adicionar validação de formato de CPF
function cpfValido(cpf) {
  // implementar
}

function normalizarCPF(cpf) {
  return cpf.replace(/[.\-]/g, "");
}

// Middleware de validação para o cadastro (POST)
function validarCadastro(req, res, next) {
  const { nome, cargo, cpf, email } = req.body;
  const erros = [];

  // Verificar campos obrigatórios
  if (!nome || nome.trim() === "") erros.push("O campo 'nome' é obrigatório.");
  if (!cargo || cargo.trim() === "") erros.push("O campo 'cargo' é obrigatório.");
  if (!cpf || cpf.trim() === "") erros.push("O campo 'cpf' é obrigatório.");
  if (!email || email.trim() === "") erros.push("O campo 'email' é obrigatório.");

  // TODO: validar formato do email
  // TODO: validar formato do CPF
  // TODO: verificar CPF duplicado

  if (erros.length > 0) {
    return res.status(400).json({ erro: "Dados inválidos.", detalhes: erros });
  }

  req.body.cpf = normalizarCPF(cpf);
  next();
}

// TODO: criar middleware validarAtualizacao

module.exports = { validarCadastro, normalizarCPF };
