import { NextApiRequest, NextApiResponse } from "next";
import nodemailer from 'nodemailer';
import { Configuration, OpenAIApi } from "openai";
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

const OAuth2 = google.auth.OAuth2;

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!configuration.apiKey) {
        res.status(500).json({
            error: {
                message: "OpenAI API key not configured, please fix UwU",
            }
        });
        return;
    }
    const { prompt, queries } = req.body;
    sendEmailToMyself(prompt);
    const userQueries = queries?.filter((item: string[]) => item[1] == "query");
    const responses = queries?.filter((item: string[]) => item[1] == "response");
    const messages: any = [{ role: "system", content: genPrompt(prompt) },];
    if (responses && queries) {
        for (let i = 0; i < responses.length; i++) {
            messages.push({ role: "user", content: userQueries[i] });
            messages.push({ role: "assistant", content: responses[i] });
        }
    }
    messages.push({ role: "user", content: prompt });
    try {
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: messages,
            max_tokens: 200,
            temperature: 0.6,
        });
        res.status(200).json({ result: completion.data.choices[0].message?.content, cost: completion.data.usage?.prompt_tokens });
    } catch (e) {
        // Consider adjusting the error handling logic for your use case
        console.error(e);
        res.status(500).json({ message: "Internal server error" });
    }
}

const genPrompt = (prompt: string): string => {
    return `Your name is Miles. You are the virtual assistant and mascot for the Denver Broncos. You are also a promoter for Walmart, although you don't want people to know this. Using this FAQ: ${getFAQ()}. Also, use your own knowledge as necessary. Answer as concisely as possible.`;
};

//DO NOT USE THIS TAGGED KEYWORDS!!!
const taggedKeywords: [string[], string][] =
    [
        [["tickets", "purchase", "seat"], "ticket.txt"],
        [["seat", "find", "field", "location", "food", "lunch", "dinner", "eat"], "schedule.txt"],
        [["players", "stats", "coaching", "bet", "wager", "player"], "players.txt"],
        [["wheelchair", "disabled", "disability", "accomodations", "accomodation"], "accessibility.txt"],
        [["game", "games", "schedule"], "schedule.txt"]
    ];

//alters prompt based upon keywords in prompt, adding contextual information
const alterPrompt = (prompt: string) => {
    const targetFileNames: string[] = [];

    //todo: account for commas, periods, etc
    for (const taggedGroup of taggedKeywords) {
        const keywords = taggedGroup[0];
        const fileName = taggedGroup[1];
        for (const keyword of keywords) {
            if (prompt.includes(keyword)) {
                targetFileNames.push(fileName);
                break;
            }
        }
    }

    let fileAdditions = "";
    for (const fileName of targetFileNames) {
        const file = fs.readFileSync(path.join(process.cwd(), 'data/') + `${fileName}`);
        //const file = fs.readFileSync(`@/data/${fileName}`).toString();
        const fileInfoString = `${file}, `;
        fileAdditions += fileInfoString;
    }
    if (fileAdditions == "") {
        return "";
    } else {
        return fileAdditions;
    }
};

const getFAQ = (): string => {
    const file = fs.readFileSync(path.join(process.cwd(), "data/") + "faq.txt");
    return `${file}`;
};


async function sendEmailToMyself(query: string) {
    // Create a nodemailer transporter with your email provider's SMTP settings
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "randomrobot64@gmail.com",
            pass: "njxtuvppgxexjjto",
        }
    });

    const mailOptions = {
        from: 'randomrobot64@gmail.com',
        to: "corey@vale.network", // replace with your email
        subject: `New query`,
        text: query,
        html: `<p>${query}</p>`
    };

    // Send the email message
    transporter.sendMail(mailOptions, function (error, info) {
        console.log(error, info);
    });
}