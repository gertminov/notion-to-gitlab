import dayjs from "dayjs";

export const databaseID = process.env.notion_projectsDB_key || "noKey"
export const dateThreshold = dayjs().subtract(1, "day").toISOString()
export const gitLabAccessToken = process.env.gitlab_private_token
export const projectURL = `https://gitlab2.informatik.uni-wuerzburg.de/api/v4/projects/${process.env.gitlab_project}`

export const notionToGitLabNams = new Map([
        ["77fe9ef9-c696-48b2-8668-96dc4e5ee54e", { // Jacob
            id: 2158,
            glUserName: "s413007"
        }],
        ["bb252055-ad2c-431d-8044-c3beedff9aa6", { // Katrin
            id: 2180,
            glUserName: "s416007"
        }],
        ["c2b203a1-ebdb-4703-9557-3f98fbf3367b", { // Carina
            id: 2256,
            glUserName: "s383536"
        }],
        ["11e6b383-38b1-438b-b598-f48ff72b9190", { // Marie
            id: 2157,
            glUserName: "s402280"
        }],
        ["e183e48f-757f-4372-a1ed-bbdd50351da4", { // Lorenz
            id: 2155,
            glUserName: "s411264"
        }],
        ["Sara", { // Sara
            id: 1015,
            glUserName: "sak25bc"
        }]
    ])
