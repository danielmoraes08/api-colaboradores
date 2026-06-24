const { v4: uuidv4 } = require("uuid");
const { lerColaboradores, salvarColaboradores } = require("../db");
const { buscarEnderecoPorCEP } = require("../services/viaCep");
const { normalizarCPF } = require("../middlewares/validacao");

// ─────────────────────────────────────────────
// POST /colaboradores  — Cadastrar colaborador
// ─────────────────────────────────────────────
async function cadastrarColaborador(req, res) {
  try {
    const { nome, cargo, cpf, email, cep, numero } = req.body;

    // Endereço via ViaCEP (obrigatório)
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
      cpf: cpf, // já normalizado pelo middleware
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

// ─────────────────────────────────────────────
// GET /colaboradores  — Listar todos
// ─────────────────────────────────────────────
function listarColaboradores(req, res) {
  try {
    const colaboradores = lerColaboradores();

    // Filtrar apenas ativos por padrão (passar ?status=todos para ver todos)
    const { status } = req.query;
    const lista =
      status === "todos"
        ? colaboradores
        : colaboradores.filter((c) => c.status === "Ativo");

    return res.status(200).json({
      total: lista.length,
      colaboradores: lista,
    });
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao listar colaboradores.", detalhe: err.message });
  }
}

// ─────────────────────────────────────────────
// GET /colaboradores/:identificador  — Buscar por ID ou CPF
// ─────────────────────────────────────────────
function buscarColaborador(req, res) {
  try {
    const { identificador } = req.params;
    const colaboradores = lerColaboradores();

    // Tenta achar por ID (UUID) ou por CPF
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

// ─────────────────────────────────────────────
// PUT/PATCH /colaboradores/:id  — Atualizar dados
// ─────────────────────────────────────────────
async function atualizarColaborador(req, res) {
  try {
    const { id } = req.params;
    const colaboradores = lerColaboradores();
    const indice = colaboradores.findIndex((c) => c.id === id);

    if (indice === -1) {
      return res.status(404).json({ erro: "Colaborador não encontrado." });
    }

    if (colaboradores[indice].status === "Inativo") {
      return res.status(400).json({
        erro: "Não é possível atualizar um colaborador inativo.",
      });
    }

    const camposPermitidos = ["nome", "cargo", "email"];
    const atualizacoes = {};

    for (const campo of camposPermitidos) {
      if (req.body[campo] !== undefined) {
        atualizacoes[campo] =
          typeof req.body[campo] === "string"
            ? req.body[campo].trim()
            : req.body[campo];
      }
    }

    // Atualizar endereço se novo CEP/numero fornecidos
    if (req.body.cep || req.body.numero) {
      const cep = req.body.cep || colaboradores[indice].endereco.cep;
      const numero = req.body.numero || colaboradores[indice].endereco.numero;

      try {
        const dadosCEP = await buscarEnderecoPorCEP(cep);
        atualizacoes.endereco = {
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
    }

    colaboradores[indice] = {
      ...colaboradores[indice],
      ...atualizacoes,
      atualizadoEm: new Date().toISOString(),
    };

    salvarColaboradores(colaboradores);

    return res.status(200).json({
      mensagem: "Colaborador atualizado com sucesso!",
      colaborador: colaboradores[indice],
    });
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao atualizar colaborador.", detalhe: err.message });
  }
}

// ─────────────────────────────────────────────
// DELETE /colaboradores/:id  — Soft Delete
// ─────────────────────────────────────────────
function desativarColaborador(req, res) {
  try {
    const { id } = req.params;
    const colaboradores = lerColaboradores();
    const indice = colaboradores.findIndex((c) => c.id === id);

    if (indice === -1) {
      return res.status(404).json({ erro: "Colaborador não encontrado." });
    }

    if (colaboradores[indice].status === "Inativo") {
      return res.status(400).json({
        erro: "Colaborador já está inativo.",
        colaborador: colaboradores[indice],
      });
    }

    // Soft Delete: apenas altera o status para "Inativo"
    colaboradores[indice].status = "Inativo";
    colaboradores[indice].desativadoEm = new Date().toISOString();
    colaboradores[indice].atualizadoEm = new Date().toISOString();

    salvarColaboradores(colaboradores);

    return res.status(200).json({
      mensagem: `Colaborador '${colaboradores[indice].nome}' desativado com sucesso (soft delete).`,
      colaborador: colaboradores[indice],
    });
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao desativar colaborador.", detalhe: err.message });
  }
}

module.exports = {
  cadastrarColaborador,
  listarColaboradores,
  buscarColaborador,
  atualizarColaborador,
  desativarColaborador,
};
