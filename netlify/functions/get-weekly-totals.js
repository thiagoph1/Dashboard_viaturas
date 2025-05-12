const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
    console.log('Função get-weekly-totals invocada');
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('MONGODB_URI não definido');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Configuração inválida', details: 'MONGODB_URI não definido' }),
            };
        }

        console.log('Conectando ao MongoDB...');
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        console.log('Conexão com MongoDB estabelecida');

        const db = client.db('dashboard');
        const collection = db.collection('daily_data');

        console.log('Agregando totais por semana...');
        const weeklyTotals = await collection.aggregate([
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%U",
                            date: { $dateFromString: { dateString: "$date" } }
                        }
                    },
                    totalViaturas: { $sum: "$totalRecords" }
                }
            },
            {
                $sort: { _id: -1 }
            },
            {
                $project: {
                    week: "$_id",
                    totalViaturas: 1,
                    _id: 0
                }
            }
        ]).toArray();

        console.log('Totais semanais:', weeklyTotals);
        await client.close();
        console.log('Conexão com MongoDB fechada');

        return {
            statusCode: 200,
            body: JSON.stringify(weeklyTotals)
        };
    } catch (error) {
        console.error('Erro em get-weekly-totals:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro ao buscar totais semanais', details: error.message })
        };
    }
};