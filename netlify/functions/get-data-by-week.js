const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
    console.log('Função get-data-by-week invocada');
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('MONGODB_URI não definido');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Configuração inválida', details: 'MONGODB_URI não definido' }),
            };
        }

        const body = JSON.parse(event.body || '{}');
        const dates = body.dates;
        if (!Array.isArray(dates) || dates.length === 0) {
            console.error('Datas inválidas:', dates);
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Datas inválidas', details: 'Forneça um array de datas' }),
            };
        }

        console.log('Conectando ao MongoDB...');
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        console.log('Conexão com MongoDB estabelecida');

        const db = client.db('dashboard');
        const collection = db.collection('daily_data');

        console.log('Buscando dados para datas:', dates);
        const data = await collection.aggregate([
            {
                $match: {
                    date: { $in: dates }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRecords: { $sum: "$totalRecords" },
                    unitCount: {
                        $mergeObjects: "$unitCount"
                    },
                    availability: {
                        $push: "$availability"
                    }
                }
            },
            {
                $project: {
                    totalRecords: 1,
                    unitCount: 1,
                    availability: {
                        $reduce: {
                            input: "$availability",
                            initialValue: [],
                            in: { $concatArrays: ["$$value", "$$this"] }
                        }
                    },
                    _id: 0
                }
            }
        ]).toArray();

        console.log('Dados agregados:', data);
        await client.close();
        console.log('Conexão com MongoDB fechada');

        if (data.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Nenhum dado encontrado para as datas fornecidas' })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(data[0])
        };
    } catch (error) {
        console.error('Erro em get-data-by-week:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro ao buscar dados da semana', details: error.message })
        };
    }
};