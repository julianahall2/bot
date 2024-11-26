const axios = require('axios').default;
const { CardFactory } = require('botbuilder');
const format = require('date-format');

class Extrato {
    constructor() {
        this.urlApi = process.env.EXTRATO_URL_API;
        this.apiKey = process.env.GATEWAY_ACCESS_KEY;

        // config do cliente axios com timeout para evitar que trave
        this.apiClient = axios.create({
            baseURL: this.urlApi,
            timeout: 5000, // 5 segundos
            headers: {
                'ocp-apim-subscription-key': this.apiKey
            }
        });
    }

    async getExtrato(id, numeroCartao) {
        try {
            const response = await this.apiClient.get(`/${id}?numeroCartao=${numeroCartao}`);
            return response.data; // retorna diretamente os dados da API
        } catch (error) {
            console.error(`Erro ao buscar o extrato: ${error.message}`);
            throw new Error('Não foi possível obter o extrato. Tente novamente mais tarde.');
        }
    }

    formatExtrato(response) {
        if (!Array.isArray(response) || response.length === 0) {
            return 'Nenhum extrato encontrado para o ID e número de cartão fornecidos.';
        }

        let table = '| **DATA COMPRA** | **DESCRIÇÃO** | **VALOR** |\n\n';
        response.forEach(element => {
            table += `| **${format("dd/MM/yyyy", new Date(element.dataTransacao))}** | **${element.comerciante}** | **R$ ${element.valor.toFixed(2)}** |\n`;
        });

        return table;
    }

    calculateTicketMedio(transactions) {
        if (!Array.isArray(transactions) || transactions.length === 0) {
            throw new Error("Nenhuma transação encontrada para calcular o ticket médio.");
        }

        const totalValue = transactions.reduce((sum, transaction) => {
            return sum + (transaction.valor || 0);
        }, 0);

        return totalValue / transactions.length; // Calcula o ticket médio
    }
}

module.exports.Extrato = Extrato;
