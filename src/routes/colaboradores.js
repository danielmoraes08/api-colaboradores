const express = require("express");
const router = express.Router();

const {
  cadastrarColaborador,
  listarColaboradores,
  buscarColaborador,
  atualizarColaborador,
  desativarColaborador,
} = require("../controllers/colaboradoresController");

const { validarCadastro, validarAtualizacao } = require("../middlewares/validacao");

// POST   /colaboradores           → Cadastrar
router.post("/", validarCadastro, cadastrarColaborador);

// GET    /colaboradores           → Listar todos (ativos por padrão)
// GET    /colaboradores?status=todos → Listar ativos e inativos
router.get("/", listarColaboradores);

// GET    /colaboradores/:identificador → Buscar por ID ou CPF
router.get("/:identificador", buscarColaborador);

// PUT    /colaboradores/:id       → Atualizar completo
// PATCH  /colaboradores/:id       → Atualizar parcial
router.put("/:id", validarAtualizacao, atualizarColaborador);
router.patch("/:id", validarAtualizacao, atualizarColaborador);

// DELETE /colaboradores/:id       → Soft Delete (status → Inativo)
router.delete("/:id", desativarColaborador);

module.exports = router;
