import {VercelRequest, VercelResponse} from "@vercel/node";
import {Client} from "@notionhq/client";
import {databaseID} from "../src/keys";

export default async (req: VercelRequest, res: VercelResponse) => {
    if (req.body?.object_attributes?.action != "close") {
        res.status(200).send("hallo")
        return
    }

    const issueID = req.body.object_attributes.iid

    const client = new Client({auth: process.env.notion_api_key});
    const result = await client.databases.query({
        database_id: databaseID,
        filter: {
            property: "gitlabRef",
            number: {
                equals: issueID
            }
        }
    })
    if (result.results.length < 1) {
        res.status(201).end();
        return
    }
    const page = result.results[0]

    await client.pages.update({
        page_id: page.id,
        properties: {
            noticedByBot:{
                date:{
                    start: new Date().toISOString()
                }
            },
            Status: {
                status: {
                    id: 'f310725e-d614-415d-b7e0-63e7ff16f524' // id of status done
                }
            },
        }
    })

    res.status(200).end()
}