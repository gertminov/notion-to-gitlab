import {Client} from "@notionhq/client";
import {databaseID, dateThreshold} from "./keys";

export async function getNotionEntriesFromLastDay(client: Client) {
    return  await client.databases.query({
        database_id: databaseID,
        filter: {
            or: [
                {
                    timestamp: "created_time",
                    created_time: {on_or_after: dateThreshold}
                },
                {
                    timestamp: "last_edited_time",
                    last_edited_time: {on_or_after: dateThreshold}
                }
            ]
        }
    });
}

