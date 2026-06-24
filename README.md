# API de Gestão de Colaboradores e Benefícios

Projeto desenvolvido para a matéria de Programação Web III da ETEC de Cotia, 3º ano técnico noturno.

A ideia surgiu de um problema real: uma startup que precisa cadastrar seus funcionários, calcular benefícios e organizar o transporte deles. Em vez de deixar tudo numa planilha bagunçada, a gente construiu uma API que centraliza tudo isso de forma organizada.

---

## O que o sistema faz

- Cadastra colaboradores com nome, cargo, CPF e e-mail
- Busca o endereço automaticamente pelo CEP (integração com o ViaCEP) — o usuário informa só o CEP e o número, o resto a API preenche sozinha
- Permite atualizar cargo, e-mail e endereço
- Bloqueia alteração de CPF por segurança
- Não apaga registros — quando um colaborador é desativado, o sistema marca ele como "Inativo" (soft delete), que é como funciona de verdade no mercado
- Valida tudo antes de salvar: CPF duplicado, e-mail sem @, campos em branco...

---

## Como rodar

Precisa ter o Node.js instalado (v18 ou superior).

```bash
git clone https://github.com/SEU_USUARIO/api-colaboradores.git
cd api-colaboradores
npm install
npm start
```

A API sobe em `http://localhost:3000`.

Se quiser rodar em modo dev com auto-reload:

```bash
npm run dev
```

---

## Rotas disponíveis

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Lista todos os endpoints |
| POST | `/colaboradores` | Cadastra um colaborador |
| GET | `/colaboradores` | Lista os colaboradores ativos |
| GET | `/colaboradores?status=todos` | Lista ativos e inativos |
| GET | `/colaboradores/:id` | Busca por ID ou CPF |
| PUT | `/colaboradores/:id` | Atualiza o colaborador inteiro |
| PATCH | `/colaboradores/:id` | Atualiza só o que precisar |
| DELETE | `/colaboradores/:id` | Desativa o colaborador |

---

## Exemplo de cadastro

```json
POST /colaboradores

{
  "nome": "Roberto Guedes",
  "cargo": "Desenvolvedora Backend",
  "cpf": "12345678901",
  "email": "roberto.guedes@empresa.com",
  "cep": "01310100",
  "numero": "1578"
}
```

A API consulta o ViaCEP e salva o endereço completo automaticamente:

```json
{
  "mensagem": "Colaborador cadastrado com sucesso!",
  "colaborador": {
    "id": "uuid-gerado-automaticamente",
    "nome": "Roberto Guedes",
    "cargo": "Desenvolvedora Backend",
    "cpf": "12345678901",
    "email": "roberto.guedes@empresa.com",
    "endereco": {
      "cep": "01310-100",
      "logradouro": "Avenida Paulista",
      "numero": "1578",
      "bairro": "Bela Vista",
      "cidade": "São Paulo",
      "estado": "SP"
    },
    "status": "Ativo"
  }
}
```

---

## Tecnologias usadas

- Node.js
- Express
- UUID
- ViaCEP (API pública)
- File System — os dados ficam salvos num arquivo `.json` local

---

## Quem fez o quê

| Integrante | O que desenvolveu |
|------------|-------------------|
| **Daniel Moraes** | Estrutura do projeto, `server.js`, `package.json`, configuração geral do Express |
| **Murilo Morales** | Lógica de leitura e escrita no JSON (`db.js`) e o arquivo de dados |
| **Vitor Reis** | Middleware de validação — bloqueia CPF duplicado, e-mail inválido e campos vazios |
| **Gustavo Henrique** | Integração com o ViaCEP (`viaCep.js`) - Viabilidade e Validação |
| **Ryan Monteiro** | Controller com toda a lógica do CRUD (`colaboradoresController.js`) |
| **Rafael Queiroz** | Definição das rotas, testes manuais e documentação |
