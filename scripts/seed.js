/* ==============================================================
 * Script: scripts/seed.js
 * Purpose: Graph database reset and seeding script using official Neo4j Bolt driver
 *          to populate CognoDB Cloud with realistic AML financial network nodes & paths.
 * Author: Praful Kumar
 * Created On: 04/08/2026
 *
 * Modification History:
 * - 04/08/2026 : Added 4-hop circular money laundering, UBO shell chains, and synthetic rings
 *
 * Notes:
 * - Executable via 'npm run seed'. Reads COGNO_URI and COGNO_PASSWORD from .env.
 * ============================================================== */

import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.COGNO_URI || 'bolt+s://demo.databases.cognodb.cloud';
const user = process.env.COGNO_USER || 'cognodb';
const password = process.env.COGNO_PASSWORD || '';

console.log('Connecting to CognoDB / Neo4j instance at:', uri);

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

async function seed() {
  const session = driver.session();
  try {
    console.log('Clearing existing graph database data...');
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('Database cleared.');

    console.log('Creating Nodes...');

    // 1. Create Persons (including Sanctioned entities and UBOs)
    await session.run(`
      UNWIND $persons AS p
      CREATE (:Person {
        id: p.id,
        name: p.name,
        nationality: p.nationality,
        riskScore: p.riskScore,
        isSanctioned: p.isSanctioned,
        ssnMasked: p.ssnMasked
      })
    `, {
      persons: [
        { id: 'PER-001', name: 'Viktor Vance', nationality: 'CYP', riskScore: 98, isSanctioned: true, ssnMasked: 'XXX-XX-9102' },
        { id: 'PER-002', name: 'Elena Rostova', nationality: 'MLT', riskScore: 88, isSanctioned: false, ssnMasked: 'XXX-XX-4819' },
        { id: 'PER-003', name: 'Marcus Sterling', nationality: 'GBR', riskScore: 42, isSanctioned: false, ssnMasked: 'XXX-XX-3301' },
        { id: 'PER-004', name: 'Sarah Chen', nationality: 'USA', riskScore: 15, isSanctioned: false, ssnMasked: 'XXX-XX-7740' },
        { id: 'PER-005', name: 'David Miller', nationality: 'DEU', riskScore: 22, isSanctioned: false, ssnMasked: 'XXX-XX-5120' },
        { id: 'PER-006', name: 'Carlos Mendez', nationality: 'PAN', riskScore: 79, isSanctioned: false, ssnMasked: 'XXX-XX-8811' }
      ]
    });

    // 2. Create Shell Companies and Holding Entities
    await session.run(`
      UNWIND $companies AS c
      CREATE (:Company {
        id: c.id,
        name: c.name,
        registrationNo: c.registrationNo,
        jurisdiction: c.jurisdiction,
        isShellCompany: c.isShellCompany,
        riskScore: c.riskScore
      })
    `, {
      companies: [
        { id: 'CMP-101', name: 'Apex Global Holdings Ltd', registrationNo: 'BVI-88192', jurisdiction: 'British Virgin Islands', isShellCompany: true, riskScore: 92 },
        { id: 'CMP-102', name: 'BlueSky Logistics LLC', registrationNo: 'PAN-44102', jurisdiction: 'Panama', isShellCompany: true, riskScore: 85 },
        { id: 'CMP-103', name: 'Aegis Capital Group', registrationNo: 'MLT-99201', jurisdiction: 'Malta', isShellCompany: true, riskScore: 78 },
        { id: 'CMP-104', name: 'Vanguard Pacific Fund', registrationNo: 'SGP-11029', jurisdiction: 'Singapore', isShellCompany: false, riskScore: 30 },
        { id: 'CMP-105', name: 'Frontier Trade Corp', registrationNo: 'CYP-77210', jurisdiction: 'Cyprus', isShellCompany: true, riskScore: 81 }
      ]
    });

    // 3. Create Accounts
    await session.run(`
      UNWIND $accounts AS a
      CREATE (:Account {
        id: a.id,
        accountNumber: a.accountNumber,
        bank: a.bank,
        balance: a.balance,
        currency: a.currency,
        riskScore: a.riskScore,
        flag: a.flag
      })
    `, {
      accounts: [
        { id: 'ACC-101', accountNumber: 'CH-9910-2281-01', bank: 'Credit Helvete', balance: 1450000.0, currency: 'USD', riskScore: 89, flag: 'SUSPICIOUS_CIRCULAR' },
        { id: 'ACC-102', accountNumber: 'CY-8820-1102-02', bank: 'Bank of Nicosia', balance: 450000.0, currency: 'USD', riskScore: 84, flag: 'SUSPICIOUS_CIRCULAR' },
        { id: 'ACC-103', accountNumber: 'PA-3390-4419-03', bank: 'Banmo Panama', balance: 445000.0, currency: 'USD', riskScore: 82, flag: 'SUSPICIOUS_CIRCULAR' },
        { id: 'ACC-104', accountNumber: 'MT-1102-7741-04', bank: 'Valletta Trust', balance: 440000.0, currency: 'USD', riskScore: 85, flag: 'SUSPICIOUS_CIRCULAR' },
        { id: 'ACC-105', accountNumber: 'SG-5501-9920-05', bank: 'DBS Private', balance: 920000.0, currency: 'USD', riskScore: 76, flag: 'CIRCULAR_LOOP_B' },
        { id: 'ACC-106', accountNumber: 'UK-7710-3341-06', bank: 'Barclays Wealth', balance: 250000.0, currency: 'USD', riskScore: 74, flag: 'CIRCULAR_LOOP_B' },
        { id: 'ACC-107', accountNumber: 'DE-2201-8830-07', bank: 'Deutsche Private', balance: 248000.0, currency: 'USD', riskScore: 70, flag: 'CIRCULAR_LOOP_B' },
        { id: 'ACC-108', accountNumber: 'US-1029-4481-08', bank: 'JPMorgan Chase', balance: 310000.0, currency: 'USD', riskScore: 91, flag: 'SANCTIONED_EXPOSURE' },
        { id: 'ACC-109', accountNumber: 'US-8830-1192-09', bank: 'Citi Commercial', balance: 180000.0, currency: 'USD', riskScore: 88, flag: 'SANCTIONED_EXPOSURE' },
        { id: 'ACC-110', accountNumber: 'CH-4410-9921-10', bank: 'UBS Global', balance: 520000.0, currency: 'USD', riskScore: 96, flag: 'SANCTIONED_EXPOSURE' },
        { id: 'ACC-111', accountNumber: 'US-7710-5502-11', bank: 'Wells Fargo', balance: 95000.0, currency: 'USD', riskScore: 80, flag: 'SYNTHETIC_RING' },
        { id: 'ACC-112', accountNumber: 'US-7710-5503-12', bank: 'Wells Fargo', balance: 112000.0, currency: 'USD', riskScore: 82, flag: 'SYNTHETIC_RING' },
        { id: 'ACC-113', accountNumber: 'US-7710-5504-13', bank: 'Wells Fargo', balance: 88000.0, currency: 'USD', riskScore: 79, flag: 'SYNTHETIC_RING' }
      ]
    });

    // 4. Create Addresses, IP Addresses, and Devices
    await session.run(`
      UNWIND $addresses AS add
      CREATE (:Address {
        id: add.id,
        street: add.street,
        city: add.city,
        country: add.country,
        postalCode: add.postalCode
      })
    `, {
      addresses: [
        { id: 'ADD-001', street: '100 Panama Offshore Way, Suite 404', city: 'Panama City', country: 'Panama', postalCode: '0801' },
        { id: 'ADD-002', street: '742 Evergreen Terrace', city: 'Springfield', country: 'USA', postalCode: '97477' },
        { id: 'ADD-003', street: '12 Wall Street', city: 'New York', country: 'USA', postalCode: '10005' }
      ]
    });

    await session.run(`
      UNWIND $ips AS ip
      CREATE (:IPAddress {
        id: ip.id,
        ip: ip.ip,
        country: ip.country,
        isVpn: ip.isVpn,
        isTorExit: ip.isTorExit
      })
    `, {
      ips: [
        { id: 'IP-001', ip: '192.168.1.100', country: 'Panama', isVpn: true, isTorExit: false },
        { id: 'IP-002', ip: '45.33.22.11', country: 'Netherlands', isVpn: true, isTorExit: true },
        { id: 'IP-003', ip: '107.170.88.99', country: 'USA', isVpn: false, isTorExit: false }
      ]
    });

    await session.run(`
      UNWIND $devices AS dev
      CREATE (:Device {
        id: dev.id,
        deviceFingerprint: dev.deviceFingerprint,
        deviceType: dev.deviceType,
        os: dev.os
      })
    `, {
      devices: [
        { id: 'DEV-8849', deviceFingerprint: 'FP-MACBOOK-PRO-88492-PAN', deviceType: 'Laptop', os: 'macOS 15.1' },
        { id: 'DEV-9912', deviceFingerprint: 'FP-IPHONE-16-PRO-99120-CYP', deviceType: 'Mobile', os: 'iOS 18.2' }
      ]
    });

    console.log('Creating Relationships...');

    // 5. Create TRANSFERRED relationships (including 4-hop circular layering loop)
    const transfers = [
      // 4-hop Circular Loop: ACC-101 -> ACC-102 -> ACC-103 -> ACC-104 -> ACC-101
      { from: 'ACC-101', to: 'ACC-102', amount: 450000.0, date: '2026-07-10', txnId: 'TXN-9001' },
      { from: 'ACC-102', to: 'ACC-103', amount: 445000.0, date: '2026-07-11', txnId: 'TXN-9002' },
      { from: 'ACC-103', to: 'ACC-104', amount: 440000.0, date: '2026-07-12', txnId: 'TXN-9003' },
      { from: 'ACC-104', to: 'ACC-101', amount: 435000.0, date: '2026-07-13', txnId: 'TXN-9004' },

      // 3-hop Circular Loop B: ACC-105 -> ACC-106 -> ACC-107 -> ACC-105
      { from: 'ACC-105', to: 'ACC-106', amount: 250000.0, date: '2026-07-15', txnId: 'TXN-9005' },
      { from: 'ACC-106', to: 'ACC-107', amount: 248000.0, date: '2026-07-16', txnId: 'TXN-9006' },
      { from: 'ACC-107', to: 'ACC-105', amount: 245000.0, date: '2026-07-17', txnId: 'TXN-9007' },

      // Sanctioned Path: ACC-108 -> ACC-109 -> ACC-110 -> (Linked to Viktor Vance)
      { from: 'ACC-108', to: 'ACC-109', amount: 800000.0, date: '2026-07-18', txnId: 'TXN-9008' },
      { from: 'ACC-109', to: 'ACC-110', amount: 780000.0, date: '2026-07-19', txnId: 'TXN-9009' }
    ];

    for (const t of transfers) {
      await session.run(`
        MATCH (a1:Account {id: $from}), (a2:Account {id: $to})
        CREATE (a1)-[:TRANSFERRED {
          amount: $amount,
          date: $date,
          currency: 'USD',
          txnId: $txnId
        }]->(a2)
      `, t);
    }

    // 6. Create BENEFICIAL_OWNER relationships (Multi-tier shell company chain)
    // Viktor Vance (Sanctioned) -> Apex Global Holdings -> BlueSky Logistics -> Aegis Capital -> ACC-101
    await session.run(`
      MATCH (p:Person {id: 'PER-001'}), (c1:Company {id: 'CMP-101'})
      CREATE (p)-[:BENEFICIAL_OWNER {sharesPercentage: 100.0, title: 'Ultimate Owner'}]->(c1)
    `);

    await session.run(`
      MATCH (c1:Company {id: 'CMP-101'}), (c2:Company {id: 'CMP-102'})
      CREATE (c1)-[:BENEFICIAL_OWNER {sharesPercentage: 85.0, title: 'Parent Entity'}]->(c2)
    `);

    await session.run(`
      MATCH (c2:Company {id: 'CMP-102'}), (c3:Company {id: 'CMP-103'})
      CREATE (c2)-[:BENEFICIAL_OWNER {sharesPercentage: 90.0, title: 'Majority Shareholder'}]->(c3)
    `);

    await session.run(`
      MATCH (c3:Company {id: 'CMP-103'}), (acc:Account {id: 'ACC-101'})
      CREATE (c3)-[:BENEFICIAL_OWNER {sharesPercentage: 100.0, title: 'Account Controller'}]->(acc)
    `);

    // Person Account Ownership
    await session.run(`
      MATCH (p:Person {id: 'PER-001'}), (acc:Account {id: 'ACC-110'})
      CREATE (p)-[:OWNS_ACCOUNT]->(acc)
    `);

    // 7. Create Shared Infrastructure Connections (Synthetic Identity Ring: ACC-111, ACC-112, ACC-113)
    await session.run(`
      MATCH (a111:Account {id: 'ACC-111'}), (a112:Account {id: 'ACC-113'}), (a113:Account {id: 'ACC-112'}),
            (ip:IPAddress {id: 'IP-001'}), (dev:Device {id: 'DEV-8849'}), (add:Address {id: 'ADD-001'})
      CREATE (a111)-[:LOGGED_IN_FROM]->(ip),
             (a112)-[:LOGGED_IN_FROM]->(ip),
             (a113)-[:LOGGED_IN_FROM]->(ip),
             (a111)-[:USED_DEVICE]->(dev),
             (a112)-[:USED_DEVICE]->(dev),
             (a111)-[:REGISTERED_AT]->(add),
             (a113)-[:REGISTERED_AT]->(add)
    `);

    console.log('Graph database successfully seeded with realistic AML financial network!');
  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    await session.close();
    await driver.close();
  }
}

seed();
