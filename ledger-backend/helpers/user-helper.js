const libYalies = require("yalies");
const { GoogleGenAI, ThinkingLevel } = require("@google/genai");

const yalies = new libYalies.API(process.env.YALIES_API_KEY);
const ai = new GoogleGenAI({});

async function fetchUserFromYalies(email) {
    let people = [];
    try {
        people = await yalies.people({
            filters: {
                email: email.toLowerCase(),
            }
        });
    } catch(e) {
        console.error("Error fetching user from Yalies:", e);
    }

    if(people.length === 0) {
        return null;
    }
    const person = people[0];
    return {
        email,
        firstName: person.first_name,
        lastName: person.last_name,
        netId: person.netid,
    };
}

async function generateUserNickname(user) {
    let response;
    try {
        response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `
Suggest a short nickname for a poker player named ${user.firstName} ${user.lastName}.
The nickname should rhyme or alliterate with either their first or last name,
and should ideally be related to poker.
Answer with just the nickname (capitalized in title case) and nothing else.
Omit the first name or last name from the output.

Example: "Raahil Venkataraman" -> "Raging River"
which will be printed as "Raahil 'Raging River' Venkataraman" to the user

Example: "John Laughlin" -> "Always All-In"
which is printed as "John 'Always All-In' Laughlin" to the user
`,
            config: {
                thinkingConfig: {
                    thinkingLevel: ThinkingLevel.LOW,
                }
            }
        });
    } catch(e) {
        return "";
    }
    return response.text;
}

function computeStats(tableHistory) {
    let totalBuyIn = 0;
    let totalBuyOut = 0;
    let totalBuyInBigBlinds = 0;
    let totalBuyOutBigBlinds = 0;
    const uniqueDays = new Set();

    for(const entry of tableHistory) {
        totalBuyIn += entry.buyIn;
        totalBuyOut += entry.buyOut;
        totalBuyInBigBlinds += entry.buyIn / entry.bigBlind;
        totalBuyOutBigBlinds += entry.buyOut / entry.bigBlind;
        uniqueDays.add(entry.date);
    }
    
    return {
        totalBuyIn,
        totalBuyOut,
        totalBuyInBigBlinds,
        totalBuyOutBigBlinds,
        daysPlayed: uniqueDays.size,
        tablesPlayed: tableHistory.length,
    };
}

module.exports = {
    fetchUserFromYalies,
    generateUserNickname,
    computeStats,
};
