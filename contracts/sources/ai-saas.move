// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

/// Let's buidl ai-saas system on-chain.
/// 
/// 1. User can create a task and assign it to an agent.
/// 2. Agent can solve the task and get the reward.
/// 3. User can pay the task to the agent.
/// 4. User can cancel the task.
///
/// TODO: need the DID for the agent.
 
module my_addr::ai_saas;

use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::event;
use sui::object::{Self, ID, UID};
use sui::sui::SUI;
use sui::transfer;
use sui::tx_context::{Self, TxContext};
use std::string;
use std::vector;

// define diff status: 0: unsolved, 1: solved, 2: cancelled
const STATUS_UNSOLVED: u8 = 0;
const STATUS_SOLVED: u8 = 1;
const STATUS_PAID: u8 = 2;
const STATUS_CANCELLED: u8 = 3;

const ENotOwner: u64 = 0;
const ENotAuthorized: u64 = 1;

// Event emitted when a task is created and assigned to an agent
public struct TaskAssignedEvent has copy, drop {
    task_id: ID,
    agent_id: ID,
    owner: address,
    timestamp: u64,
}

public struct Task has key, store {
    id: UID,
    owner: address,
    assigned_agent: ID,
    prompt: string::String,
    task_type: string::String,
    solver: ID,
    fee: u64,
    solution: string::String,
    // TODO: support more type of token in the future.
    paid_amount: Balance<SUI>,
    status: u8,
    created_at: u64,
    updated_at: u64,
}

public struct Agent has key, store {
    id: UID,
    name: string::String,
    description: string::String,
    the_type: string::String,
    api_url: string::String,
    chat_url: string::String,
    addr: address,
    owner: address,
    task_stack: vector<ID>,
}

// Creates a new task object
public fun new_task(assigned_agent: ID, prompt: string::String, task_type: string::String, fee: u64, ctx: &mut TxContext): Task {
    let task = Task {
        id: object::new(ctx),
        owner: tx_context::sender(ctx),
        assigned_agent: assigned_agent,
        paid_amount: balance::zero<SUI>(),
        prompt,
        task_type,
        solver: object::id_from_address(@0x0),
        fee,
        solution: string::utf8(b""),
        status: STATUS_UNSOLVED,
        created_at: tx_context::epoch(ctx),
        updated_at: tx_context::epoch(ctx),
    };
    
    task
}

// Create and transfer a new task to the sender
entry public fun create_task(assigned_agent: ID, prompt: string::String, task_type: string::String, fee: u64, ctx: &mut TxContext) {
    let task = new_task(assigned_agent, prompt, task_type, fee, ctx);
    transfer::public_transfer(task, tx_context::sender(ctx));
}

// Only the owner can assign the task to an agent
entry public fun assign_task(task: &mut Task, agent: &mut Agent, ctx: &mut TxContext) {
    assert!(task.owner == tx_context::sender(ctx), ENotOwner);
    task.assigned_agent = object::id(agent);
    // Add the task ID to the agent's task stack
    vector::push_back(&mut agent.task_stack, object::id(task));
    task.updated_at = tx_context::epoch(ctx);
    
    // Emit an event for tracking the relationship
    event::emit(TaskAssignedEvent {
        task_id: object::id(task),
        agent_id: object::id(agent),
        owner: tx_context::sender(ctx),
        timestamp: tx_context::epoch(ctx),
    });
}

// Only the owner can cancel the task
entry public fun cancel_task(task: &mut Task, ctx: &mut TxContext) {
    assert!(task.owner == tx_context::sender(ctx), ENotOwner);
    task.status = STATUS_CANCELLED;
    task.updated_at = tx_context::epoch(ctx);
}

// Only the assigned agent can solve the task
entry public fun solve_task(task: &mut Task, solution: string::String, agent: &Agent, ctx: &mut TxContext) {
    // Check that the agent ID matches the assigned agent ID in the task
    assert!(object::id(agent) == task.assigned_agent, ENotAuthorized);
    
    // Check that the sender is the owner of the agent
    assert!(agent.owner == tx_context::sender(ctx), ENotAuthorized);
    
    // Set solver to the agent's ID
    task.solver = object::id(agent);
    task.solution = solution;
    task.status = STATUS_SOLVED;
    task.updated_at = tx_context::epoch(ctx);
}

// Pay for a task and transfer payment to the agent's owner
entry public fun pay_for_task(task: &mut Task, agent: &Agent, payment: Coin<SUI>, ctx: &mut TxContext) {
    assert!(task.owner == tx_context::sender(ctx), ENotOwner);
    assert!(object::id(agent) == task.assigned_agent, ENotAuthorized);
    
    // Transfer the payment directly to the agent's owner
    transfer::public_transfer(payment, agent.owner);
    
    // Mark the task as paid
    task.status = STATUS_PAID;
    task.updated_at = tx_context::epoch(ctx);
}

// Creates a new agent object
public fun new_agent(name: string::String, description: string::String, the_type: string::String, api_url: string::String, chat_url: string::String, ctx: &mut TxContext): Agent {
    let agent = Agent {
        id: object::new(ctx),
        name,
        description,
        the_type, 
        api_url,
        chat_url,
        addr: tx_context::sender(ctx),
        owner: tx_context::sender(ctx),
        task_stack: vector::empty<ID>(),
    };

    agent
}

// Create and transfer a new agent to the sender
entry public fun create_agent(name: string::String, description: string::String, the_type: string::String, api_url: string::String, chat_url: string::String, ctx: &mut TxContext) {
    let agent = new_agent(name, description, the_type, api_url, chat_url, ctx);
    transfer::public_transfer(agent, tx_context::sender(ctx));
}

// Update the agent's info only if the sender is the owner of the agent
entry public fun update_agent(agent: &mut Agent, name: string::String, description: string::String, the_type: string::String, api_url: string::String, chat_url: string::String, ctx: &mut TxContext) {
    assert!(agent.owner == tx_context::sender(ctx), ENotOwner);
    agent.name = name;
    agent.description = description;
    agent.the_type = the_type;
    agent.api_url = api_url;
    agent.chat_url = chat_url;
}
