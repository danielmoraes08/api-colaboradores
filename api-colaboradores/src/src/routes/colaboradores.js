const express = require("express");
const router = express.Router();

const {
  cadastrarColaborador,
  listarColaboradores,
  buscarColaborador,
  // atualizarColaborador,  <- ainda não implementado
  // desativarColaborador,  <- ainda não implementado
} = require("../controllers/colaboradoresController");

const { validarCadastro } = require("../middlewares/validacao");

// POST /colaboradores — Cadastrar
router.post("/", validarCadastro, cadastrarColaborador);

// GET /colaboradores — Listar todos
router.get("/", listarColaboradores);

// GET /colaboradores/:identificador — Buscar por ID ou CPF
router.get("/:identificador", buscarColaborador);

// TODO: adicionar rota PUT e PATCH para atualizar (aguardando Ryan terminar o controller)
// TODO: adicionar rota DELETE para soft delete

module.exports = router;
