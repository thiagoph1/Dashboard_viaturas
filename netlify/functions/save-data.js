const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
  console.log('Função save-data invocada');
  console.log('Método HTTP:', event.httpMethod);
  console.log('Corpo da requisição:', event.body);

  try {
    // Validar método HTTP
    if (event.httpMethod !== 'POST') {
      console.log('Método HTTP inválido');
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Método não permitido' }),
      };
    }

    // Obter e validar dados
    let data;
    try {
      data = JSON.parse(event.body);
      console.log('Dados parseados:', data);
    } catch (parseError) {
      console.log('Erro ao parsear JSON:', parseError.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'JSON inválido', details: parseError.message }),
      };
    }

    if (!data || !data.date || typeof data.totalRecords !== 'number' || !data.unitCount || !data.availability) {
      console.log('Validação falhou:', {
        hasData: !!data,
        hasDate: !!data?.date,
        hasTotalRecords: !!data?.totalRecords,
        isTotalRecordsNumber: typeof data?.totalRecords === 'number',
        hasUnitCount: !!data?.unitCount,
        hasAvailability: !!data?.availability,
      });
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Dados inválidos', details: 'Campos obrigatórios ausentes' }),
      };
    }

    // Conectar ao MongoDB
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.log('MONGODB_URI não definido');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Configuração inválida', details: 'MONGODB_URI não definido' }),
      };
    }

    console.log('Tentando conectar ao MongoDB...');
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
      await client.connect();
      console.log('Conexão com MongoDB estabelecida');
    } catch (connectError) {
      console.log('Erro ao conectar ao MongoDB:', connectError.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro de conexão com o banco', details: connectError.message }),
      };
    }

    try {
      const db = client.db('dashboard');
      const collection = db.collection('daily_data');

      console.log('Inserindo documento para data:', data.date);
      await collection.insertOne({
        date: data.date,
        totalRecords: data.totalRecords,
        unitCount: data.unitCount,
        availability: data.availability,
        createdAt: new Date(),
      });
      console.log('Documento inserido com sucesso');
    } catch (insertError) {
      console.log('Erro ao inserir documento:', insertError.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro ao salvar dados', details: insertError.message }),
      };
    } finally {
      await client.close();
      console.log('Conexão com MongoDB fechada');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Dados salvos com sucesso' }),
    };
  } catch (error) {
    console.error('Erro inesperado:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao salvar dados', details: error.message }),
    };
  }
};