# @jsreport/jsreport-reports
[![NPM Version](http://img.shields.io/npm/v/@jsreport/jsreport-reports.svg?style=flat-square)](https://npmjs.com/package/@jsreport/jsreport-reports)

**jsreport extension adding support for storing rendering outputs for later use**

See https://jsreport.net/learn/reports

## Changelog

### 3.1.1

- reports cleanup should still clean all old reports found in the current interval, but it does in batches configured by `extensions.reports.cleanLimit`
- prevent reports cleanup to run if it is already running

### 3.1.0

- reports cleanup now use a limit of report to clean on each interval (default 10, can be configured with `extensions.reports.cleanParallelLimit` option)

### 3.0.7

- remove meaningless log

### 3.0.6

- fix bug when there was render error

### 3.0.5

- fix return of proper filename for the report

### 3.0.4

- fix async rendering execution

### 3.0.3

- fix for passing data to async reports

### 3.0.2

fix some issue with sample data and input data in async reports

### 3.0.0-beta.1

Adaptations for the v3 APIs
