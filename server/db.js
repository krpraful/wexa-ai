/**
 * Developer: Praful (jobspraful@gmail.com)
 * Application: NexusAML - Financial Crime & Graph Intelligence Application
 * Assignment: Wexa AI Take-Home Assignment (CognoDB + openCypher)
 * File: server/db.js - CognoDB / Neo4j Bolt Driver Connection & Session Management
 */

import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.COGNO_URI || 'bolt+s://demo.databases.cognodb.cloud';
const user = process.env.COGNO_USER || 'cognodb';
const password = process.env.COGNO_PASSWORD || '';

let driver = null;
let isConnected = false;
let connectionError = null;

// Initialize Neo4j / CognoDB driver instance
export function getDriver() {
  if (!driver && uri && password) {
    try {
      driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
        maxConnectionLifetime: 3 * 60 * 1000,
        connectionTimeout: 5000,
      });
    } catch (err) {
      console.error('Failed to create Neo4j driver instance:', err.message);
      connectionError = err.message;
    }
  }
  return driver;
}

// Verify connection health
export async function verifyConnection() {
  const d = getDriver();
  if (!d) {
    isConnected = false;
    connectionError = 'Database URI or Password not configured in environment variables.';
    return { isConnected, error: connectionError };
  }

  try {
    const serverInfo = await d.getServerInfo();
    isConnected = true;
    connectionError = null;
    return { isConnected, serverInfo };
  } catch (err) {
    isConnected = false;
    connectionError = err.message || 'Unable to connect to CognoDB Cloud instance.';
    return { isConnected, error: connectionError };
  }
}

// Run parameterised Cypher query against CognoDB
export async function executeCypher(cypher, params = {}) {
  const d = getDriver();
  if (!d) {
    throw new Error('Database driver not initialized');
  }

  const session = d.session();
  try {
    const result = await session.run(cypher, params);
    return result.records;
  } finally {
    await session.close();
  }
}

// Helper to convert Neo4j record results into clean JSON objects
export function formatRecords(records) {
  return records.map(record => {
    const obj = {};
    record.keys.forEach(key => {
      const val = record.get(key);
      obj[key] = formatNeo4jValue(val);
    });
    return obj;
  });
}

function formatNeo4jValue(val) {
  if (val === null || val === undefined) return null;
  if (neo4j.isInt(val)) return val.toNumber();
  if (Array.isArray(val)) return val.map(formatNeo4jValue);
  if (typeof val === 'object') {
    if (val.labels && val.properties) {
      // It's a Node
      return {
        id: val.identity ? val.identity.toString() : val.properties.id,
        labels: val.labels,
        properties: formatNeo4jProperties(val.properties),
      };
    }
    if (val.type && val.properties) {
      // It's a Relationship
      return {
        id: val.identity ? val.identity.toString() : val.properties.id,
        type: val.type,
        startNodeId: val.start ? val.start.toString() : null,
        endNodeId: val.end ? val.end.toString() : null,
        properties: formatNeo4jProperties(val.properties),
      };
    }
    if (val.segments) {
      // It's a Path
      return {
        length: val.length,
        nodes: val.nodes.map(formatNeo4jValue),
        relationships: val.relationships.map(formatNeo4jValue),
      };
    }
    return formatNeo4jProperties(val);
  }
  return val;
}

function formatNeo4jProperties(props) {
  const formatted = {};
  for (const [k, v] of Object.entries(props)) {
    formatted[k] = neo4j.isInt(v) ? v.toNumber() : v;
  }
  return formatted;
}

export function getConnectionState() {
  return { isConnected, connectionError, uri, user };
}
