/**
 * Serviço de integração com a API pública do ViaCEP.
 * Busca logradouro, bairro, cidade e estado a partir de um CEP.
 */

/**
 * Consulta o ViaCEP e retorna os dados de endereço.
 * @param {string} cep - CEP com 8 dígitos
 * @returns {Object} Dados do endereço
 */
async function buscarEnderecoPorCEP(cep) {
  // Normalizar CEP: apenas números
  const cepLimpo = cep.replace(/\D/g, "");

  if (cepLimpo.length !== 8) {
    throw new Error("CEP inválido: deve conter 8 dígitos.");
  }

  const url = `https://viacep.com.br/ws/${cepLimpo}/json/`;

  let resposta;
  try {
    resposta = await fetch(url);
  } catch (err) {
    throw new Error("Não foi possível conectar ao serviço ViaCEP. Verifique sua conexão.");
  }

  if (!resposta.ok) {
    throw new Error(`Erro ao consultar ViaCEP: status ${resposta.status}`);
  }

  const dados = await resposta.json();

  if (dados.erro) {
    throw new Error("CEP não encontrado na base do ViaCEP.");
  }

  return {
    cep: dados.cep,
    logradouro: dados.logradouro,
    bairro: dados.bairro,
    cidade: dados.localidade,
    estado: dados.uf,
  };
}

module.exports = { buscarEnderecoPorCEP };
