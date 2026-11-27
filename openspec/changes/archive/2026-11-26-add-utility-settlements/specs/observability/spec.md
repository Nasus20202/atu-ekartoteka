# Spec Delta

## MODIFIED Requirements

### Requirement: Database Size Metrics

Row counts for core database tables SHALL be exposed as an observable gauge.

#### Scenario: Table row counts exported

- **GIVEN** OpenTelemetry is initialised
- **WHEN** the metric reader collects from the `ekartoteka.db.size` gauge
- **THEN** it returns the cached row count for each of the following tables, each as a separate data point with a `table` attribute:
  `homeownersAssociation`, `apartment`, `charge`, `chargeNotification`, `payment`, `user`, `utilitySettlement`, `meterReading`, `annualCostSettlement`

#### Scenario: Count refresh interval

- **GIVEN** the database metrics are registered
- **WHEN** 30 seconds elapse
- **THEN** fresh `COUNT(*)` queries are issued to the database for all tracked tables and the cache is updated

#### Scenario: Metric export interval

- **GIVEN** the `PeriodicExportingMetricReader` configuration
- **WHEN** the SDK is running
- **THEN** metrics are pushed to the OTLP endpoint every 60 seconds

#### Scenario: Counts on the dashboard

- **GIVEN** the Grafana dashboard in `grafana/dashboards`
- **WHEN** its overview is shown
- **THEN** it has a count panel for utility settlements, meter readings and annual cost settlements
