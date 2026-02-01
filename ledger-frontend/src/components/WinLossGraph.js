/**
 * VIBE CODED
 */


import React, { useMemo } from "react";
import style from "./stylesheets/WinLossGraph.module.scss";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const WinLossGraph = ({ user }) => {
    const data = useMemo(() => {
        if (!user || !user.tableHistory) return [];

        // Sort history by date
        const sorted = [...user.tableHistory].sort((a, b) => new Date(a.date) - new Date(b.date));

        // Aggregate by date
        const dailyProfits = [];

        sorted.forEach(entry => {
            const dateObj = new Date(entry.date);
            const dateStr = dateObj.toDateString();
            const profitStr = (entry.buyOut - entry.buyIn);

            const lastEntry = dailyProfits[dailyProfits.length - 1];

            if (lastEntry && lastEntry.dateStr === dateStr) {
                lastEntry.dailyProfit += profitStr;
            } else {
                dailyProfits.push({
                    dateStr,
                    dateObj,
                    dailyProfit: profitStr
                });
            }
        });

        let cumulative = 0;
        return dailyProfits.map((entry) => {
            cumulative += entry.dailyProfit;
            return {
                date: entry.dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }),
                fullDate: entry.dateStr,
                profit: cumulative / 100, // Convert to dollars for display
            };
        });
    }, [user]);

    if (!data.length) return null;

    return (
        <div className={style.graphContainer} style={{ width: "100%", height: 400 }}>
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                        formatter={(value) => [`$${value.toFixed(2)}`, "Total Profit"]}
                        labelFormatter={(label, payload) => {
                            if (payload && payload.length > 0) {
                                return payload[0].payload.fullDate;
                            }
                            return label;
                        }}
                    />
                    <ReferenceLine y={0} stroke="#000" />
                    <Line type="monotone" dataKey="profit" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default WinLossGraph;
