const { MessageFactory } = require('botbuilder');
const {
    ChoiceFactory,
    ChoicePrompt,
    ComponentDialog,
    TextPrompt,
    WaterfallDialog,
    DialogSet,
    DialogTurnStatus
} = require('botbuilder-dialogs');
const { ProdutoProfile } = require('../produtoProfile');
const { Produto } = require('../produto');
const { Extrato } = require('../extrato');

const NAME_PROMPT = 'NAME_PROMPT';
const CARTAO_NUMBER_PROMPT = 'CARTAO_NUMBER_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const PRODUCT_PROFILE = 'PRODUCT_PROFILE';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class ProductDialog extends ComponentDialog {
    constructor(userState) {
        super('productDialog');

        this.productProfile = userState.createProperty(PRODUCT_PROFILE);

        this.addDialog(new TextPrompt(NAME_PROMPT));
        this.addDialog(new TextPrompt(CARTAO_NUMBER_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.menuStep.bind(this),
            this.inputStep.bind(this),
            this.processStep.bind(this),
            this.finalStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async menuStep(step) {
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Escolha a opção desejada:',
            choices: ChoiceFactory.toChoices(['Consultar Pedidos', 'Consultar Produtos', 'Extrato de Compras', 'Calcular Ticket Médio'])
        });
    }

    async inputStep(step) {
        step.values.choice = step.result.value;

        switch (step.values.choice) {
            case 'Consultar Pedidos':
            case 'Extrato de Compras':
            case 'Calcular Ticket Médio':
                return await step.prompt(NAME_PROMPT, 'Digite o seu ID:');
            case 'Consultar Produtos':
                return await step.prompt(NAME_PROMPT, 'Digite o nome do produto:');
        }
    }

    async processStep(step) {
        const choice = step.values.choice;
        const inputValue = step.result;

        try {
            if (choice === 'Consultar Pedidos' || choice === 'Extrato de Compras' || choice === 'Calcular Ticket Médio') {
                step.values.id = inputValue;
                return await step.prompt(CARTAO_NUMBER_PROMPT, 'Digite o número do cartão:');
            }

            if (choice === 'Consultar Produtos') {
                const produto = new Produto();
                const response = await produto.getProduto(inputValue);

                const card = produto.createProductCard(response[0]);
                await step.context.sendActivity({ attachments: [card] });
                return await step.next();
            }
        } catch (error) {
            console.error(error);
            await step.context.sendActivity('Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.');
            return await step.endDialog();
        }
    }

    async finalStep(step) {
        const choice = step.values.choice;

        if (choice === 'Consultar Pedidos' || choice === 'Extrato de Compras') {
            const id = step.values.id;
            const cardNumber = step.result;

            try {
                const extrato = new Extrato();
                const response = await extrato.getExtrato(id, cardNumber);

                if (choice === 'Extrato de Compras') {
                    const formattedExtrato = extrato.formatExtrato(response);
                    await step.context.sendActivity(MessageFactory.text(formattedExtrato));
                } else if (choice === 'Consultar Pedidos') {
                    // Implementar lógica para consultar pedidos se necessário
                    await step.context.sendActivity('Consulta de pedidos ainda não implementada.');
                }
            } catch (error) {
                console.error(error);
                await step.context.sendActivity('Erro ao consultar os dados. Verifique as informações fornecidas.');
            }
        }

        if (choice === 'Calcular Ticket Médio') {
            const id = step.values.id;
            const cardNumber = step.result;

            try {
                const extrato = new Extrato();
                const transactions = await extrato.getExtrato(id, cardNumber);
                const ticketMedio = extrato.calculateTicketMedio(transactions);

                await step.context.sendActivity(`O ticket médio das suas compras é: R$ ${ticketMedio.toFixed(2)}`);
            } catch (error) {
                console.error(error);
                await step.context.sendActivity('Erro ao calcular o ticket médio. Certifique-se de que há transações disponíveis.');
            }
        }

        await step.context.sendActivity('Obrigado por usar nosso serviço!');
        return await step.endDialog();
    }
}

module.exports.ProductDialog = ProductDialog;
