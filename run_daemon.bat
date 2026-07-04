@echo off
rem Run SnapKitty AgentOS daemon with HTTP demo on port 8080
cd /d "%~dp0"
if not defined GO111MODULE set GO111MODULE=on
go run src/sovereign-daemon/main.go serve
