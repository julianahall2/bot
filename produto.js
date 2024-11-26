const axios = require('axios').default;
const { CardFactory } = require('botbuilder');

class Produto {
    constructor() {
        this.urlApi = process.env.PRODUTO_URL_API;
        this.apiKey = process.env.GATEWAY_ACCESS_KEY;

        // config do cliente axios com timeout para evitar que trave
        this.apiClient = axios.create({
            baseURL: this.urlApi,
            timeout: 5000, // 5 seg
            headers: {
                'ocp-apim-subscription-key': this.apiKey
            }
        });
    }

    async getProduto(productName) {
        try {
            const response = await this.apiClient.get(`?productName=${encodeURIComponent(productName)}`);
            if (!response.data || response.data.length === 0) {
                throw new Error('Nenhum produto encontrado com o nome fornecido.');
            }
            return response.data; // retorna diretamente os dados da api
        } catch (error) {
            console.error(`Erro ao buscar o produto: ${error.message}`);
            throw new Error('Não foi possível obter as informações do produto. Tente novamente mais tarde.');
        }
    }

    createProductCard(productData) {
        if (!productData) {
            throw new Error('Os dados do produto estão incompletos ou ausentes.');
        }

        return CardFactory.thumbnailCard(
            productData.productName,
            [{ url: productData.urlFoto }],
            [],
            {
                subtitle: `Preço do produto: R$ ${productData.price.toFixed(2)}`,
                text: productData.productDescription
            }
        );
    }
}

module.exports.Produto = Produto;
