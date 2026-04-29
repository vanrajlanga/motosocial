import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { API_BASE_URL, API_ORIGIN } from '../utils/apiConfig';
import { getAccessToken, getCurrentUser } from '../utils/authService';

export function SystemStatus() {
  const [status, setStatus] = useState({
    backendConfig: false,
    accessToken: false,
    user: false,
    serverHealth: false,
  });
  const [loading, setLoading] = useState(true);
  const [serverResponse, setServerResponse] = useState<any>(null);

  const checkStatus = async () => {
    setLoading(true);

    const backendOk = !!API_ORIGIN;
    const token = getAccessToken();
    const hasToken = !!token;
    const user = getCurrentUser();
    const hasUser = !!user;

    let serverOk = false;
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      setServerResponse(data);
      serverOk = response.ok && data.status === 'ok';
    } catch (error) {
      console.error('Server health check failed:', error);
      setServerResponse({ error: String(error) });
    }

    setStatus({
      backendConfig: backendOk,
      accessToken: hasToken,
      user: hasUser,
      serverHealth: serverOk,
    });

    setLoading(false);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const StatusItem = ({ label, ok }: { label: string; ok: boolean }) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
      <span className="font-medium text-slate-900">{label}</span>
      {ok ? (
        <CheckCircle2 className="w-6 h-6 text-green-600" />
      ) : (
        <XCircle className="w-6 h-6 text-red-600" />
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">System Status</h1>
        <button
          onClick={checkStatus}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        <StatusItem label="Backend URL Configured" ok={status.backendConfig} />
        <StatusItem label="Access Token Present" ok={status.accessToken} />
        <StatusItem label="User Logged In" ok={status.user} />
        <StatusItem label="Server Health" ok={status.serverHealth} />
      </div>

      <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm">
        <div className="mb-2 text-slate-400">// Configuration</div>
        <div>Backend URL: {API_ORIGIN || 'NOT SET'}</div>
        <div>API Base: {API_BASE_URL}</div>
        <div className="mt-3 mb-2 text-slate-400">// Current User</div>
        <div>Email: {getCurrentUser()?.email || 'Not logged in'}</div>
        <div>Name: {getCurrentUser()?.name || 'N/A'}</div>
        <div className="mt-3 mb-2 text-slate-400">// Server Response</div>
        <div>{JSON.stringify(serverResponse, null, 2)}</div>
      </div>

      {!status.serverHealth && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900 mb-1">Server Connection Issue</p>
              <p className="text-sm text-yellow-800">
                The backend server at {API_ORIGIN} is not responding. Make sure
                it's running (<code>npm run dev</code> in the <code>backend/</code> folder).
              </p>
            </div>
          </div>
        </div>
      )}

      {!status.accessToken && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900 mb-1">Not Authenticated</p>
              <p className="text-sm text-red-800">
                You are not logged in. Please logout and login again to restore your session.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <p className="font-semibold text-green-900 mb-1">How Authentication Works</p>
            <p className="text-sm text-green-800 mb-2">
              This app uses a local Node.js + MySQL backend with JWT tokens:
            </p>
            <ul className="text-xs text-green-700 list-disc list-inside space-y-1">
              <li>Login hits <code>POST /api/auth/signin</code> and receives a JWT</li>
              <li>The JWT is stored in localStorage and sent as <code>Authorization: Bearer</code></li>
              <li>Backend verifies the JWT with the <code>JWT_SECRET</code> from <code>.env</code></li>
              <li>If JWT is invalid/expired, you'll see "401 Unauthorized" errors</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}