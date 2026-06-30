const express = require("express");
const app = express();

// ─── Middlewares Globais ───────────────────────
app.use(express.json()); // Parsear body JSON
app.use(express.urlencoded({ extended: true })); // Parsear form-data

// ─── Rotas ────────────────────────────────────
const colaboradoresRoutes = require("./routes/colaboradores");
app.use("/colaboradores", colaboradoresRoutes);

// Rota raiz — informações da API
app.get("/", (req, res) => {
  res.status(200).json({
    api: "API de Gestão de Colaboradores e Benefícios",
    versao: "1.0.0",
    escola: "ETEC de Cotia • PW3",
    endpoints: {
      "POST   /colaboradores":            "Cadastrar colaborador (com busca automática de CEP via ViaCEP)",
      "GET    /colaboradores":            "Listar colaboradores ativos",
      "GET    /colaboradores?status=todos":"Listar todos (ativos e inativos)",
      "GET    /colaboradores/:id":        "Buscar por ID (UUID)",
      "GET    /colaboradores/:cpf":       "Buscar por CPF (11 dígitos)",
      "PUT    /colaboradores/:id":        "Atualizar colaborador (completo)",
      "PATCH  /colaboradores/:id":        "Atualizar colaborador (parcial)",
      "DELETE /colaboradores/:id":        "Desativar colaborador (soft delete)",
    },
  });
});

// ─── Tratamento de rota não encontrada ────────
app.use((req, res) => {
  res.status(404).json({
    erro: "Rota não encontrada.",
    sugestao: "Acesse GET / para ver os endpoints disponíveis.",
  });
});

// ─── Tratamento de erros globais ──────────────
app.use((err, req, res, next) => {
  console.error("Erro não tratado:", err);
  res.status(500).json({ erro: "Erro interno do servidor." });
});

// ─── Iniciar servidor ─────────────────────────
const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
  console.log(`\n✅  API de Colaboradores rodando em http://localhost:${PORTA}`);
  console.log(`📋  Documentação: GET http://localhost:${PORTA}/\n`);
});
