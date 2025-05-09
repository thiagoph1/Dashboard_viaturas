const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
  try {
    // Validar método HTTP
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Método não permitido' }),
      };
    }

    // Conectar ao MongoDB
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db('dashboard');
    const collection = db.collection('daily_data');

    // Recuperar todos os dados, ordenados por data
    const history = await collection.find({}).sort({ date: 1 }).toArray();

    await client.close();

    return {
      statusCode: 200,
      body: JSON.stringify(history),
    };
  } catch (error) {
    console.error('Erro:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao recuperar histórico' }),
    };
  }
};