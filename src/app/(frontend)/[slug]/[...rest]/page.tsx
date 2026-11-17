import { notFound } from 'next/navigation'

/**
 * Aucune URL publique n'a plus d'un segment hors /posts. Sans cette route, une
 * adresse comme /a/b tomberait sur la 404 brute de Next (deux layouts racines :
 * site et admin), sans le design du site.
 */
export default function CatchAll() {
  notFound()
}
