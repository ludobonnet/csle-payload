/**
 * MariaDB connection utilities for WordPress database
 */

import mysql from 'mysql2/promise'
import { config } from '../config.js'
import { info, error } from './logger.js'

let pool: mysql.Pool | null = null

export async function getConnection(): Promise<mysql.Pool> {
  if (!pool) {
    pool = mysql.createPool({
      host: config.wordpress.host,
      port: config.wordpress.port,
      user: config.wordpress.user,
      password: config.wordpress.password,
      database: config.wordpress.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    })
    info('Connected to WordPress MariaDB database')
  }
  return pool
}

export async function closeConnection(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    info('Closed MariaDB connection')
  }
}

/**
 * Execute a SQL query and return results
 */
export async function query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
  const conn = await getConnection()
  try {
    const [rows] = await conn.execute(sql, params)
    return rows as T[]
  } catch (err) {
    error(`SQL Error: ${sql}`, err)
    throw err
  }
}

/**
 * Get WordPress table name with prefix
 */
export function wpTable(name: string): string {
  return `${config.wordpress.tablePrefix}${name}`
}

/**
 * Get WordPress global users table
 */
export function wpUsersTable(): string {
  return config.wordpress.usersTable
}

// Type definitions for WordPress database rows

export interface WPPost {
  ID: number
  post_author: number
  post_date: Date
  post_date_gmt: Date
  post_content: string
  post_title: string
  post_excerpt: string
  post_status: string
  post_name: string
  post_modified: Date
  post_modified_gmt: Date
  post_parent: number
  guid: string
  menu_order: number
  post_type: string
  post_mime_type: string
  comment_count: number
}

export interface WPPostMeta {
  meta_id: number
  post_id: number
  meta_key: string
  meta_value: string
}

export interface WPTerm {
  term_id: number
  name: string
  slug: string
  term_group: number
}

export interface WPTermTaxonomy {
  term_taxonomy_id: number
  term_id: number
  taxonomy: string
  description: string
  parent: number
  count: number
}

export interface WPTermRelationship {
  object_id: number
  term_taxonomy_id: number
  term_order: number
}

export interface WPUser {
  ID: number
  user_login: string
  user_email: string
  user_nicename: string
  display_name: string
}
