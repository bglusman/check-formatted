// External Dependencies
const fs     = require('fs');
const github = require('@actions/github');
const core   = require('@actions/core');
const { exec } = require("child_process");

const context = github.context;
const repo    = context.payload.repository;
const owner   = repo.owner;

const FILES   = new Set();

const gh   = github.getOctokit(core.getInput('token'));
const args = { owner: owner.name || owner.login, repo: repo.name };


function debug(msg, obj = null) {
	core.debug(formatLogMessage(msg, obj));
}

function fetchCommitData(commit) {
	args.ref = commit.id || commit.sha;

	debug('Calling gh.repos.getCommit() with args', args)

	return gh.repos.getCommit(args);
}

function formatLogMessage(msg, obj = null) {
	return obj ? `${msg}: ${toJSON(obj)}` : msg;
}

async function getCommits() {
	let commits;

	debug('Getting commits...');

	switch(context.eventName) {
		case 'push':
			commits = context.payload.commits;
		break;

		case 'pull_request':
			const url = context.payload.pull_request.commits_url;

			commits = await gh.paginate(`GET ${url}`, args);
		break;

		default:
			info('You are using this action on an event for which it has not been tested. Only the "push" and "pull_request" events are officially supported.');

			commits = [];
		break;
	}

	return commits;
}

function info(msg, obj = null) {
	core.info(formatLogMessage(msg, obj));
}

function isAdded(file) {
	return 'added' === file.status;
}

function isModified(file) {
	return 'modified' === file.status;
}

function isRemoved(file) {
	return 'removed' === file.status;
}

function isRenamed(file) {
	return 'renamed' === file.status;
}

async function checkFormatting() {
	debug('FILES', Array.from(FILES.values()));
	process.exitCode = 0
	var dir;

	Array.from(FILES.values()).forEach(filename => {
		dir = exec(`mix format --check-formatted ${filename}`, function(err) {
			if (err) {
				process.exitCode = 1
			}
			console.log(stdout);
		});
		
		dir.on('exit', function (code) {
			if (code !== 0) {
				process.exitCode = 1
			}
		});
	})
}

async function processCommitData(result) {
	debug('Processing API Response', result);

	if (! result || ! result.data) {
		return;
	}

	result.data.files.forEach(file => {
		(isAdded(file) || isModified(file) || isRenamed(file)) && FILES.add(file.filename);
	});
}


function toJSON(value, pretty=true) {
	return pretty
		? JSON.stringify(value, null, 4)
		: JSON.stringify(value);
}


debug('context', context);
debug('args', args);

getCommits().then(commits => {
	// Exclude merge commits
	commits = commits.filter(c => ! c.parents || 1 === c.parents.length);

	if ('push' === context.eventName) {
		commits = commits.filter(c => c.distinct);
	}

	debug('All Commits', commits);

	Promise.all(commits.map(fetchCommitData))
		.then(data => Promise.all(data.map(processCommitData)))
		.then(checkFormatting)
		.catch(err => core.error(err) && (process.exitCode = 1));
});

