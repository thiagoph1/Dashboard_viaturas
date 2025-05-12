const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
    console.log('Função get-daily-totals invocada');
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

        console.log('Buscando totais por dia...');
        const dailyTotals = await collection.aggregate([
            {
                $match: {
                    date: { $exists: true, $type: "string" }
                }
            },
            {
                $addFields: {
                    dateRaw: "$date",
                    dateObj: {
                        $dateFromString: {
                            dateString: "$date",
                            format: "%Y-%m-%d",
                            onError: null
                        }
                    }
                }
            },
            {
                $match: {
                    dateObj: { $ne: null }
                }
            },
            {
                $addFields: {
                    year: { $year: "$dateObj" },
                    month: { $month: "$dateObj" }
                }
            },
            {
                $group: {
                    _id: {
                        date: "$date",
                        year: "$year",
                        month: "$month"
                    },
                    totalViaturas: { $sum: "$totalRecords" },
                    debug: {
                        $first: {
                            dateRaw: "$dateRaw",
                            dateObj: "$dateObj"
                        }
                    }
                }
            },
            {
                $sort: { "_id.date": -1 }
            },
            {
                $project: {
                    date: "$_id.date",
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
                    debug: 1,
                    _id: 0
                }
            }
        ]).toArray();

        console.log('Totais diários:', JSON.stringify(dailyTotals, null, 2));
        await client.close();
        console.log('Conexão com MongoDB fechada');

        return {
            statusCode: 200,
            body: JSON.stringify(dailyTotals)
        };
    } catch (error) {
        console.error('Erro em get-daily-totals:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro ao buscar totais diários', details: error.message })
        };
    }
};