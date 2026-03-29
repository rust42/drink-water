{{/*
Expand the name of the chart.
*/}}
{{- define "drinkwater.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "drinkwater.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "drinkwater.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "drinkwater.labels" -}}
helm.sh/chart: {{ include "drinkwater.chart" . }}
{{ include "drinkwater.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "drinkwater.selectorLabels" -}}
app.kubernetes.io/name: {{ include "drinkwater.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Namespace
*/}}
{{- define "drinkwater.namespace" -}}
{{- default .Values.namespace .Release.Namespace }}
{{- end }}

{{/*
Image repository helper
*/}}
{{- define "drinkwater.imageRepository" -}}
{{- if .Values.image.registry }}
{{- printf "%s/%s" .Values.image.registry .Values.image.repository }}
{{- else }}
{{- .Values.image.repository }}
{{- end }}
{{- end }}
