import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:8000';

function App() {
  const [stats, setStats] = useState(null);
  const [commits, setCommits] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all data when page loads
    Promise.all([
      axios.get(`${API_URL}/api/stats`),
      axios.get(`${API_URL}/api/commits`),
      axios.get(`${API_URL}/api/predict`)
    ]).then(([statsRes, commitsRes, predRes]) => {
      setStats(statsRes.data);
      setCommits(commitsRes.data.commits);
      setPrediction(predRes.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading">Loading your DevPulse dashboard...</div>;

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1>DevPulse</h1>
          <p>Your coding intelligence dashboard</p>
        </div>
        {stats && (
          <div className="profile">
            <img src={stats.avatar} alt="avatar" className="avatar" />
            <div>
              <div className="username">@{stats.username}</div>
              <div className="meta">{stats.public_repos} repos · {stats.followers} followers</div>
            </div>
          </div>
        )}
      </header>

      <main className="main">
        {prediction && (
          <div className="insight-card">
            <span className="insight-emoji">🧠</span>
            <p>{prediction.insight}</p>
          </div>
        )}

        <div className="grid">
          <div className="card">
            <h2>Weekly Commit Pattern</h2>
            <p className="card-sub">Actual commits by day of week</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={prediction?.weekly_pattern}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="actual_commits" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2>ML Productivity Prediction</h2>
            <p className="card-sub">Model predicts your score per day</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={prediction?.weekly_pattern}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="predicted_score" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2>Recent Commit Activity</h2>
          {commits.length === 0 ? (
            <p>No recent commits found — start coding! 🚀</p>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Repository</th><th>Commits</th></tr>
              </thead>
              <tbody>
                {commits.map((c, i) => (
                  <tr key={i}>
                    <td>{c.date}</td>
                    <td>{c.repo}</td>
                    <td><span className="badge">{c.commits}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;