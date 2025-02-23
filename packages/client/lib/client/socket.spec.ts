import { strict as assert } from 'assert';
import { spy } from 'sinon';
import RedisSocket, { RedisSocketOptions } from './socket';

describe('Socket', () => {
    function createSocket(options: RedisSocketOptions): RedisSocket {
        const socket = new RedisSocket(
            () => Promise.resolve(),
            options
        );

        socket.on('error', () => {
            // ignore errors
        });

        return socket;
    }

    describe('reconnectStrategy', () => {
        it('custom strategy', async () => {
            const numberOfRetries = 10;

            const reconnectStrategy = spy((retries: number) => {
                assert.equal(retries + 1, reconnectStrategy.callCount);

                if (retries === numberOfRetries) return new Error(`${numberOfRetries}`);

                const time = retries * 2;
                return time;
            });

            const socket = createSocket({
                host: 'error',
                connectTimeout: 1,
                reconnectStrategy
            });

            await assert.rejects(socket.connect(), {
                message: `${numberOfRetries}`
            });

            assert.equal(socket.isOpen, false);
        });

        it('should handle errors', async () => {
            const socket = createSocket({
                host: 'error',
                connectTimeout: 1,
                reconnectStrategy(retries: number) {
                    if (retries === 1) return new Error('done');
                    throw new Error();
                }
            });

            await assert.rejects(socket.connect());

            assert.equal(socket.isOpen, false);
        });
    });
});
