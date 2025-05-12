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

        console.log('Agregando totais por semana do mês...');
        const weeklyTotals = await collection.aggregate([
            {
                $addFields: {
                    dateObj: { $dateFromString: { dateString: "$date" } }
                }
            },
            {
                $addFields: {
                    year: { $year: "$dateObj" },
                    month: { $month: "$dateObj" },
                    dayOfMonth: { $dayOfMonth: "$dateObj" },
                    weekOfMonth: {
                        $ceil: {
                            $divide: [
                                "$dayOfMonth",
                                7
                            ]
                        }
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: "$year",
                        month: "$month",
                        weekOfMonth: "$weekOfMonth"
                    },
                    totalViaturas: { $sum: "$totalRecords" },
                    minDate: { $min: "$dateObj" }
                }
            },
            {
                $sort: { "minDate": -1 }
            },
            {
                $project: {
                    week: "$_id.weekOfMonth",
                    month: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$_id.month", 1] }, then: "Janeiro" },
                                { case: { $eq: ["$_id.month", 2] }, then: "Fevereiro" },
                                { case: { $eq: ["$_id.month", 3] }, then: "Março" },
                                { case: { $eq: ["$_id.month", 4] }, then: "Abril" },
                                { case: { $eq: ["$_id.month", 5] }, then: "Maio" },
                                { case: { $eq: ["$_id.month", 6] }, then: "Junho" },
                                { case: { $eq: ["$_id.month", 7] }, then: "Julho" },
                                { case: { $eq: ["$_id.month", 8] }, then: "Agosto" },
                                { case: { $eq: ["$_id.month", 9] }, then: "Setembro" },
                                { case: { $eq: ["$_id.month", 10] }, then: "Outubro" },
                                { case: { $eq: ["$_id.month", 11] }, then: "Novembro" },
                                { case: { $eq: ["$_id.month", 12] }, then: "Dezembro" }
                            ],
                            default: "Desconhecido"
                        }
                    },
                    year: "$_id.year",
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