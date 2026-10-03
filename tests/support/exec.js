import { execSync as nodeExecSync } from 'child_process';

export function workerDb() {
    return `sariapp_test_${process.env.TEST_PARALLEL_INDEX ?? '0'}`;
}

export function execSync(command, options) {
    const scoped = command.replace(
        'docker compose exec -T app',
        `docker compose exec -T -e DB_DATABASE=${workerDb()} -e QUEUE_CONNECTION=database app`
    );

    return nodeExecSync(scoped, options);
}
