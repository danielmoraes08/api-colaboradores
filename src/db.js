const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "./data/colaboradores.json");
/**
 * Lê todos os colaboradores do arquivo JSON.
 * @returns {Array} Lista de colaboradores
 */
function lerColaboradores() {
  try {
    const conteudo = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(conteudo);
  } catch {
    return [];
  }
}

/**
 * Salva a lista de colaboradores no arquivo JSON.
 * @param {Array} colaboradores
 */
function salvarColaboradores(colaboradores) {
  fs.writeFileSync(DB_PATH, JSON.stringify(colaboradores, null, 2), "utf-8");
}

module.exports = { lerColaboradores, salvarColaboradores };
