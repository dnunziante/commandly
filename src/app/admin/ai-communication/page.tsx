import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { CommunicationExamplesManager } from "@/components/communication-examples-manager";
import { AICommunicationStandardsForm } from "@/components/ai-communication-standards-form";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { normalizeStandards } from "@/lib/rag/prompt-compiler";

export default async function AICommunicationStandardsPage() {
  const viewer = await getViewer();
  const canManage = Boolean(viewer && !viewer.demo && ["tenant_admin", "platform_owner"].includes(viewer.role));
  const supabase = canManage && viewer?.organizationId ? await createClient() : null;
  const [{ data: examples }, { data: saved }] = supabase ? await Promise.all([supabase.from("knowledge_documents").select("id,title,original_filename,status,created_at").eq("organization_id", viewer!.organizationId).eq("context_type", "communication_example").order("created_at", { ascending: false }), supabase.from("organization_settings").select("ai_tone,ai_response_length,ai_sales_approach,ai_discovery_level,ai_competitor_behavior,ai_cta_strength,ai_formatting,ai_recommendation_behavior,ai_advanced_instructions,communication_rules,assistant_instructions").eq("organization_id", viewer!.organizationId).maybeSingle()]) : [{ data: [] }, { data: null }];
  const formatting = saved?.ai_formatting || {}; const recommendations = saved?.ai_recommendation_behavior || {};
  const standards = normalizeStandards({ tone: saved?.ai_tone, responseLength: saved?.ai_response_length, salesApproach: saved?.ai_sales_approach, discoveryLevel: saved?.ai_discovery_level, competitorBehavior: saved?.ai_competitor_behavior, ctaStrength: saved?.ai_cta_strength, useShortParagraphs: formatting.shortParagraphs, useBullets: formatting.bullets, useHeadings: formatting.headings, avoidLargeBlocks: formatting.avoidLargeBlocks, askDiscoveryBeforeRecommendation: recommendations.askDiscoveryBeforeRecommendation, explainRecommendation: recommendations.explainRecommendation, offerAlternative: recommendations.offerAlternative, connectBenefits: recommendations.connectBenefits, advancedInstructions: saved?.ai_advanced_instructions || saved?.communication_rules || saved?.assistant_instructions || "" });
  return <AppShell title="Admin · AI Communication Standards"><PageHeader eyebrow="AI settings" title="AI Communication Standards" description="Configure how this organization communicates. The Knowledge Base remains the source of facts."/><AICommunicationStandardsForm canManage={canManage} standards={standards}/><div style={{ marginTop: 18 }}><CommunicationExamplesManager canManage={canManage} examples={examples || []}/></div></AppShell>;
}
