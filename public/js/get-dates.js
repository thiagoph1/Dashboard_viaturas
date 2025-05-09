const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
    console.log('Função get-dates invocada');
    try {
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

        const dates = await collection.distinct('date');
        console.log('Datas encontradas:', dates);

        await client.close();
        console.log('Conexão com MongoDB fechada');

        return {
            statusCode: 200,
            body: JSON.stringify(dates.sort().reverse()), // Ordenar do mais recente ao mais antigo
        };
    } catch (error) {
        console.error('Erro em get-dates:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro ao buscar datas', details: error.message }),
        };
    }
};