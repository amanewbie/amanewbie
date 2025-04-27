-- Replace this with a pastebin/raw GitHub link if you want to load it remotely
loadstring([[
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local player = Players.LocalPlayer
local camera = workspace.CurrentCamera

-- Change this to the name of the ball in the workspace
local ball = workspace:FindFirstChild("Ball") 

if not ball then
    warn("No ball found!")
    return
end

RunService.RenderStepped:Connect(function()
    if ball and ball:IsDescendantOf(workspace) then
        camera.CFrame = CFrame.new(camera.CFrame.Position, ball.Position)
    end
end)
]])()

