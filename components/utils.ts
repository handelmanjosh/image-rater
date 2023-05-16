import AWS, { S3 } from "aws-sdk";
import { ImageModelProps } from "./imageModel";

AWS.config.update({
    accessKeyId: 'AKIAX3HTXUF4MRQPTLFT',
    secretAccessKey: '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',
    region: 'us-east-1',
});

const image_url = "https://broncos-data-processing.s3.amazonaws.com/images/";
const data_url = "https://broncos-data-processing.s3.amazonaws.com/results/";

export const getStartingImage = async () => {
    const s3 = new S3();
    const params = {
        Bucket: "broncos-data-processing",
        Key: "currentProcessingImageNum.txt",
    };
    const response = await s3.getObject(params).promise();
    const number = Number(response.Body?.toString('utf-8'));
    return number;
};
export const updateStartingImage = async (num: number) => {
    const s3 = new S3();
    const params = {
        Bucket: "broncos-data-processing",
        Key: "currentProcessingImageNum.txt",
        Body: `${num}`
    };
    await s3.upload(params).promise();
};
export const reset = async () => {
    const s3 = new S3();
    const params = {
        Bucket: "broncos-data-processing",
        Key: "currentProcessingImageNum.txt",
        Body: `0`
    };
    await s3.upload(params).promise();
    const params2 = {
        Bucket: "broncos-data-processing",
        Key: "currentUploadNum.txt",
        Body: `0`
    };
    await s3.upload(params2).promise();
};

const getBasicData = async (num: number) => {
    const data = await getImageData(num);
    if (data) {
        return { players: data.players, finishedPlayers: data.finishedPlayers };
    } else {
        return null;
    }
};
export const getAllBasicData = async (low: number, high: number): Promise<ImageModelProps[]> => {
    let allBasicData: ImageModelProps[] = [];
    for (let i = low; i < high; i++) {
        const status = await checkImage(i); //checks if there is an image corresponding to index
        if (status) {
            const basicData = await getBasicData(i);
            if (basicData) {
                allBasicData.push({ percentage: basicData.players == 0 ? 0 : basicData.players / basicData.finishedPlayers * 100, src: `${image_url}${i}.png`, redirect: `/images/${i}`, number: basicData.players });
            } else {
                allBasicData.push({ percentage: 0, src: `${image_url}${i}.png`, redirect: `/images/${i}`, number: 0 });
            }
        } else {
            break;
        }

    }
    return allBasicData;
};
export const getDetailedData = async (num: number) => {
    const data = await getImageData(num);
    return data;
};
const checkImage = async (num: number): Promise<boolean> => {
    const s3 = new S3();
    const params = {
        Bucket: "broncos-data-processing",
        Key: `images/${num}.png`
    };
    try {
        const response = await s3.getObject(params).promise();
        return true;
    } catch (e) {
        return false;
    }
};
const getImageData = async (num: number): Promise<any | null> => {
    const s3 = new S3();
    const params = {
        Bucket: "broncos-data-processing",
        Key: `results/${num}.txt`
    };
    try {
        const response = await s3.getObject(params).promise();
        if (response.Body) {
            const data = response.Body.toString('utf-8');
            const result = parseData(data);
            return result;
        } else {
            return null;
        }
    } catch (e) {
        return null;
    }
};

const parseData = (data: string) => {
    let array = data.split("\n");
    let playersArray: string[][] = refactor(array);
    let finishedPlayers: number = 0;
    const players = playersArray.length;
    const allData: any[] = [];
    for (const item of playersArray) {
        const data: any = { location: undefined, position: undefined, team: undefined };
        let definedCount: number = 0;
        for (const row of item) {
            const rowItems = row.split(":");
            if (rowItems[0].includes("Player Location")) {
                data.location = rowItems[1];
            } else if (rowItems[0].includes("Player Position")) {
                data.position = rowItems[1];
            } else if (rowItems[0].includes("Player Team")) {
                data.team = rowItems[1];
            }
            if (rowItems[1]) definedCount++;
        }
        if (definedCount == 3) {
            finishedPlayers++;
        }
        allData.push(data);
    }
    return { players, finishedPlayers, data: allData };
};
const refactor = (array: any[]): any[][] => {
    let temp: any[] = [];
    let result: any[][] = [];
    for (let i = 0; i < array.length; i++) {
        if (i % 3 == 0 && i !== 0) {
            result.push(temp);
            temp = [];
        }
        temp.push(array[i]);
    }
    if (temp.length !== 0 && temp[0] !== "") {
        result.push(temp);
    }
    return result;
};