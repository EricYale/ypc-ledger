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

        let cumulative = 0;
        return sorted.map((entry) => {
            const profitStr = (entry.buyOut - entry.buyIn); 
            // entry.buyIn/buyOut are in cents
            cumulative += profitStr;
            return {
                date: new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }),
                fullDate: new Date(entry.date).toDateString(),
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
