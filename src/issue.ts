import {NotionToMarkdown} from "notion-to-md";
import {PageObjectResponse} from "@notionhq/client/build/src/api-endpoints";
import {notionToGitLabNams} from "./keys";

export interface Issue {
    title: string
    labels?: string
    due_date?: string
    assignee_id?: number
    assignee_ids?: number[]
    description?: string
    state_event?: string
    failed?:string
}

export async function makeNewIssue(notion2MD: NotionToMarkdown, result: PageObjectResponse, props: any) {
    const markdownPromise = notion2MD.pageToMarkdown(result.id);



    let newIssue: Issue = {
        title: props.Name.title[0].plain_text
    }

    const status = getStatus(props.Status.status.name);
    newIssue.labels = status.status
    if (status.done) {
        newIssue.state_event = "close"
    }

    const tags = getTags(props.Tags.multi_select);
    if (tags) {
        let newtags
        if (newIssue.labels.length > 0) {
            newtags = "," + tags.join(',');
        } else {
            newtags =  tags.join(',')

        }
        newIssue.labels += newtags
    }

    const date = getDate(props["Due Date"])
    if (date) {
        newIssue.due_date = date
    }

    if (props.Failed.select) {
        newIssue.failed = props.Failed.select.name;
    }



    const pageContent = await markdownPromise;

    newIssue.description = notion2MD.toMarkdownString(pageContent)

    setAssignee(props.Assignee.people, newIssue)
    return newIssue;
}


function getTags(tags: { id: string, name: string, color: string }[]) {
    return tags.map(tag => tag.name)
}

function getDate(date: any) {
    if (date.date) {
        return date.date.end || date.date.start;
    } else {
        return null
    }

}

function getStatus(status: string): { done: boolean, status: string } {
    const state = {
        done: false,
        status: ""
    }

    switch (status) {
        case "Not started":
            return state
        case "Sprint Backlog":
            state.status = "Sprint Backlog"
            return state
        case "In progress":
            state.status = "Doing"
            return state
        case "Pending":
            state.status = "Pending"
            return state
        case "Done":
            state.done = true
            return state
        default:
            state.status = "Error unknown state in getStatus()"
            return state
    }

}

function setAssignee(people: { id: string, name: string }[], issue: Issue) {
    if (people.length == 0) {
        return;
    } else if (people.length == 1) {
        const curUser = notionToGitLabNams.get(people[0].id);

        if (curUser) {
            issue.assignee_id = curUser.id;
            return;
        } else {
            console.log("could not find user: " + people[0].id + ":" + people[0].name)
        }
    } else {
        const usernames: string[] = [];
        people.map(person => {
            const glPerson = notionToGitLabNams.get(person.id);
            if (glPerson) {
                const str = `- [ ] @${glPerson.glUserName}`
                usernames.push(str);
            }
        });

        issue.description ||= "" // set desc to "" if undefined

        issue.description += "\n\n" + usernames.join('  \n');

    }
}
