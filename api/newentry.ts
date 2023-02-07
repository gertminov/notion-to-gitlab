import {VercelRequest, VercelResponse} from "@vercel/node"
import {Client} from "@notionhq/client"
import {gitLabAccessToken, projectURL} from "../src/keys";
import axios from "axios";
import {makeNewIssue} from "../src/issue";
import {PageObjectResponse} from "@notionhq/client/build/src/api-endpoints";
import {NotionToMarkdown} from "notion-to-md"
import {getNotionEntriesFromLastDay} from "../src/notion-handler";

function authRequest(auth: string | string[], res: VercelResponse) {
    if (auth != process.env.auth_string) { // ensure request is authorized
        console.log(auth);
        res.status(401).send("unauthorized attempt")
        return false
    }
    return true
}

let client: Client
export default async (req: VercelRequest, res: VercelResponse) => {

    if (!authRequest(req.query.auth, res)) return


    client = new Client({auth: process.env.notion_api_key});
    const notion2MD = new NotionToMarkdown({notionClient: client})

    const response = await getNotionEntriesFromLastDay(client);

    const {newIssues, updatedIssues} = sortResults(response.results as PageObjectResponse[]);

    let httpStatus = 200
    let errors = "errors:"


    async function createNewIssue(result: PageObjectResponse) {
        const props: any = result.properties
        const newIssue = await makeNewIssue(notion2MD, result, props);
        if (props.Failed.select && props.Failed.select.name == "Fail") {
            console.log("Issue #" + props.gitlabRef.number + "failed")
            return
        }

        try {
            const fetchRes = await axios.post(`${projectURL}/issues?private_token=${gitLabAccessToken}`,
                newIssue);

            await client.pages.update({
                page_id: result.id,
                properties: {
                    gitlabRef: fetchRes.data.iid,
                    noticedByBot: {
                        start: new Date().toISOString(),
                    }
                }
            });
        } catch (e) {
            await setToFailed(result.id)
            httpStatus = 500
            errors += " no" + result.id
        }
    }

    const issuePromises = []
    for (const result of newIssues) {
        issuePromises.push(createNewIssue(result));
    }

    async function updateIssue(result: PageObjectResponse) {
        const props: any = result.properties
        if (props.Failed.select && props.Failed.select.name == "Fail") {
            console.log("Issue #" + props.gitlabRef.number + "failed")
            return
        }
        const newIssue = await makeNewIssue(notion2MD, result, props);
        try {
            await axios.put(`${projectURL}/issues/${props.gitlabRef.number}?private_token=${gitLabAccessToken}`, newIssue)
            await client.pages.update({
                page_id: result.id,
                properties: {
                    noticedByBot: {
                        date: {
                            start: new Date().toISOString(),
                        }
                    }
                }
            })
        } catch (e) {
            await setToFailed(result.id)
            httpStatus = 500
            errors += " #" + props.gitlabRef.number

        }
    }

    for (const result of updatedIssues) {
        issuePromises.push(updateIssue(result));
    }

    await Promise.all(issuePromises)
    res.status(httpStatus).send(`created ${newIssues.length} new Issues and updated ${updatedIssues.length} ` + errors)
    // res.status(200).send(response)
}

function sortResults(results: PageObjectResponse[]) {
    const newIssues: PageObjectResponse[] = [];
    const updatedIssues: PageObjectResponse[] = [];

    results.forEach(result => {
        // @ts-ignore
        const gitIssueNr = result.properties.gitlabRef.number
        if (result.created_time != result.last_edited_time && gitIssueNr) {

            // if something has been edited since to bot last updated this entry,
            // this entry will be pushed to the updatedIssues list
            const lastEdited = Date.parse(result.last_edited_time);
            // @ts-ignore
            const noticed = Date.parse(result.properties.noticedByBot.date.start);
            if (noticed < lastEdited) {
                updatedIssues.push(result);
            }
        } else if (!gitIssueNr) {
            newIssues.push(result);
        }
    })

    return {
        newIssues, updatedIssues
    }
}


async function setToFailed(issueId: string,) {

    await client.pages.update({
        page_id: issueId,
        properties: {
            noticedByBot: {
                date: {
                    start: new Date().toISOString(),
                }
            },
            Failed: {
                select: {
                    name: "Fail"
                }
            }
        }
    })
}





