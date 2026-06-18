/** @returns {boolean} Activo por defecto hasta conectar el backend real. */
export function isMockMode() {
    return import.meta.env.VITE_USE_MOCKS !== 'false';
}

function mockDelay(ms = 180) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withMockDelay(value, ms) {
    await mockDelay(ms);
    return value;
}

export function mockOk(data) {
    return { status: 200, statusText: 'OK', data };
}
