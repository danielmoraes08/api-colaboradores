const { v4: uuidv4 } = require("uuid");
const { lerColaboradores, salvarColaboradores } = require("../db");
const { buscarEnderecoPorCEP } = require("../services/viaCep");
const { normalizarCPF } = require("../middlewares/validacao");

// POST /colaboradores — Cadastrar colaborador
async function cadastrarColaborador(req, res) {
  try {
    const { nome, cargo, cpf, email, cep, numero } = req.body;

    if (!cep || !numero) {
      return res.status(400).json({
        erro: "Os campos 'cep' e 'numero' são obrigatórios para o endereço.",
      });
    }

    let endereco;
    try {
      const dadosCEP = await buscarEnderecoPorCEP(cep);
      endereco = {
        cep: dadosCEP.cep,
        logradouro: dadosCEP.logradouro,
        numero: numero.toString(),
        bairro: dadosCEP.bairro,
        cidade: dadosCEP.cidade,
        estado: dadosCEP.estado,
      };
    } catch (errCEP) {
      return res.status(400).json({ erro: errCEP.message });
    }

    const novoColaborador = {
      id: uuidv4(),
      nome: nome.trim(),
      cargo: cargo.trim(),
      cpf: cpf,
      email: email.trim().toLowerCase(),
      endereco,
      status: "Ativo",
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    const colaboradores = lerColaboradores();
    colaboradores.push(novoColaborador);
    salvarColaboradores(colaboradores);

    return res.status(201).json({
      mensagem: "Colaborador cadastrado com sucesso!",
      colaborador: novoColaborador,
    });
  } catch (err) {
    return res.status(500).json({ erro: "Erro interno do servidor.", detalhe: err.message });
  }
}

// GET /colaboradores — Listar todos
function listarColaboradores(req, res) {
  try {
    const colaboradores = lerColaboradores();
    const { status } = req.query;
    const lista =
      status === "todos"
        ? colaboradores
        : colaboradores.filter((c) => c.status === "Ativo");

    return res.status(200).json({ total: lista.length, colaboradores: lista });
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao listar colaboradores.", detalhe: err.message });
  }
}

// GET /colaboradores/:identificador — Buscar por ID ou CPF
function buscarColaborador(req, res) {
  try {
    const { identificador } = req.params;
    const colaboradores = lerColaboradores();
    const cpfNorm = normalizarCPF(identificador);
    const encontrado = colaboradores.find(
      (c) => c.id === identificador || c.cpf === cpfNorm
    );

    if (!encontrado) {
      return res.status(404).json({ erro: "Colaborador não encontrado." });
    }

    return res.status(200).json(encontrado);
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao buscar colaborador.", detalhe: err.message });
  }
}

// TODO: implementar atualizarColaborador (PUT/PATCH)

// TODO: implementar desativarColaborador (DELETE - soft delete)

module.exports = {
  cadastrarColaborador,
  listarColaboradores,
  buscarColaborador,
  // atualizarColaborador,
  // desativarColaborador,
};
