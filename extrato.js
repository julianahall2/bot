const axios = require('axios').default;
const { CardFactory } = require('botbuilder');
const format = require('date-format');

class Extrato {
    urlApi = process.env.EXTRATO_URL_API;
    apiKey = process.env.GATEWAY_ACCESS_KEY;
    
    async getExtrato(id, numeroCartao) {
        const headers = {
            'ocp-apim-subscription-key': this.apiKey
        };
        return await axios.get(`${this.urlApi}/${id}?numeroCartao=${numeroCartao}`, { headers });
    }

    formatExtrato(response) {
        let table = `| **DATA COMPRA** | **DESCRICAO** | **VALOR** |\n\n
        `;
        response.forEach(element => {
            table += `\n\n| **${format("dd/MM/yyyy", new Date(element.dataTransacao))}** | **${element.comerciante}** | **R$ ${element.valor}** |\n\n` });

        return table;
    }

    calculateTicketMedio(transactions) {
        if (!Array.isArray(transactions) || transactions.length === 0) {
            throw new Error("Nenhuma transação encontrada para calcular o ticket médio.");
        }
        const totalValue = transactions.reduce((sum, transaction) => {
            return sum + (transaction.valor || 0);
        }, 0);

        const ticketMedio = totalValue / transactions.length;
    return ticketMedio;
    }
}

module.exports.Extrato = Extrato;
