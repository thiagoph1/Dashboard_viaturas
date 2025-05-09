const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
  try {
    // Validar método HTTP
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Método não permitido' }),
      };
    }

    // Obter dados do corpo da requisição
    const data = JSON.parse(event.body);
    if (!data || !data.date || !data.totalRecords || !data.unitCount || !data.availability) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Dados inválidos' }),
      };
    }

    // Conectar ao MongoDB
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db('dashboard');
    const collection = db.collection('daily_data');

    // Salvar dados com data
    await collection.insertOne({
      date: data.date, // ex.: "2025-05-09"
      totalRecords: data.totalRecords,
      unitCount: data.unitCount,
      availability: data.availability,
      createdAt: new Date(),
    });

    await client.close();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Dados salvos com sucesso' }),
    };
  } catch (error) {
    console.error('Erro:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao salvar dados' }),
    };
  }
};