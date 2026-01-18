"use client"

import * as React from "react"
import {
  getRootFactors,
  getScenarios,
  getOutcomes,
  getFactorScenarioLabels,
  getScenarioFactorLabels,
  getScenarioOutcomeLabels,
  getOutcomeScenarioLabels,
  type RootFactor
} from "@/data/parameter-graph-data"

interface RootFactorsTableProps {
  showSubItems?: boolean
}

export function RootFactorsTable({ showSubItems = true }: RootFactorsTableProps) {
  const factors = getRootFactors()

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="text-left py-2 px-3 font-semibold">Root Factor</th>
            <th className="text-left py-2 px-3 font-semibold">Description</th>
            <th className="text-left py-2 px-3 font-semibold">Sub-components</th>
            <th className="text-left py-2 px-3 font-semibold">Scenarios Influenced</th>
          </tr>
        </thead>
        <tbody>
          {factors.map((factor) => (
            <tr key={factor.id} className="border-b border-slate-100 dark:border-slate-800">
              <td className="py-2 px-3">
                {factor.href ? (
                  <a href={factor.href} className="text-primary hover:underline font-medium">
                    {factor.label}
                  </a>
                ) : (
                  <span className="font-medium">{factor.label}</span>
                )}
              </td>
              <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                {factor.description || '—'}
              </td>
              <td className="py-2 px-3">
                {showSubItems && factor.subItems && factor.subItems.length > 0 ? (
                  <span className="text-slate-600 dark:text-slate-400">
                    {factor.subItems.map(item => item.label).join(', ')}
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                {getFactorScenarioLabels(factor.id).join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface ScenariosTableProps {
  showDescription?: boolean
}

export function ScenariosTable({ showDescription = true }: ScenariosTableProps) {
  const scenarios = getScenarios()

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="text-left py-2 px-3 font-semibold">Ultimate Scenario</th>
            {showDescription && <th className="text-left py-2 px-3 font-semibold">Description</th>}
            <th className="text-left py-2 px-3 font-semibold">Key Root Factors</th>
            <th className="text-left py-2 px-3 font-semibold">Ultimate Outcomes</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((scenario) => (
            <tr key={scenario.id} className="border-b border-slate-100 dark:border-slate-800">
              <td className="py-2 px-3">
                {scenario.href ? (
                  <a href={scenario.href} className="text-primary hover:underline font-medium">
                    {scenario.label}
                  </a>
                ) : (
                  <span className="font-medium">{scenario.label}</span>
                )}
              </td>
              {showDescription && (
                <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                  {scenario.description || '—'}
                </td>
              )}
              <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                {getScenarioFactorLabels(scenario.id)}
              </td>
              <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                {getScenarioOutcomeLabels(scenario.id)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface OutcomesTableProps {
  showScenarios?: boolean
}

export function OutcomesTable({ showScenarios = true }: OutcomesTableProps) {
  const outcomes = getOutcomes()

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="text-left py-2 px-3 font-semibold">Outcome</th>
            <th className="text-left py-2 px-3 font-semibold">Question</th>
            {showScenarios && <th className="text-left py-2 px-3 font-semibold">Key Ultimate Scenarios</th>}
          </tr>
        </thead>
        <tbody>
          {outcomes.map((outcome) => (
            <tr key={outcome.id} className="border-b border-slate-100 dark:border-slate-800">
              <td className="py-2 px-3">
                {outcome.href ? (
                  <a href={outcome.href} className="text-primary hover:underline font-medium">
                    {outcome.label}
                  </a>
                ) : (
                  <span className="font-medium">{outcome.label}</span>
                )}
              </td>
              <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                {outcome.question || '—'}
              </td>
              {showScenarios && (
                <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                  {getOutcomeScenarioLabels(outcome.id)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default RootFactorsTable
