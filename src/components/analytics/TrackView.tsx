'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'

interface ProjectViewProps {
  type: 'project_view'
  projectId: string
}

interface ModelViewProps {
  type: 'model_view'
  projectId: string
  modelId: string
}

type Props = ProjectViewProps | ModelViewProps

export function TrackView(props: Props) {
  useEffect(() => {
    if (props.type === 'model_view') {
      trackEvent({ event_type: 'model_view', project_id: props.projectId, model_id: props.modelId })
    } else {
      trackEvent({ event_type: 'project_view', project_id: props.projectId })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
