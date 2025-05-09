const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
    console.log('Função get-data-by-date invocada');
    try {
        if (event.httpMethod !== 'POST') {
            console.log('Método HTTP inválido');
            return {
                statusCode: 405,
                body: JSON.stringify({ error: 'Método não permitido' }),
            };
        }

        const { date } = JSON.parse(event.body);
        if (!date) {
            console.log('Data não fornecida');
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Data não fornecida' }),
            };
        }

        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.log('MONGODB_URI não definido');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Configuração inválida' }),
            };
        }

        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        console.log('Conexão com MongoDB estabelecida');

        const db = client.db('dashboard');
        const collection = db.collection('daily_data');

        const data = await collection.findOne({ date });
        console.log('Dados encontrados para', date, ':', data);

        await client.close();
        console.log('Conexão com MongoDB fechada');

        if (!data) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Dados não encontrados para a data especificada' }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    } catch (error) {
        console.error('Erro em get-data-by-date:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro ao buscar dados', details: error.message }),
        };
    }
};