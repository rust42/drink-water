package com.example.drinkwater.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "water_intake")
data class WaterIntake(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    @Column(nullable = false)
    val deviceIdentifier: String,
    @Column(nullable = false)
    val amount: Int, // in milliliters
    @Column(nullable = false)
    val unit: String = "ml",
    @Column(nullable = false)
    val timestamp: Instant = Instant.now(),
    @Column(length = 500)
    val notes: String? = null,
    @Column(nullable = false)
    val createdAt: Instant = Instant.now(),
)

@Entity
@Table(name = "daily_goals")
data class DailyGoal(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    @Column(nullable = false)
    val deviceIdentifier: String,
    @Column(nullable = false)
    val goalAmount: Int, // in milliliters
    @Column(nullable = false)
    val date: String, // YYYY-MM-DD format
    @Column(nullable = false)
    val createdAt: Instant = Instant.now(),
    @Column(nullable = false)
    val updatedAt: Instant = Instant.now(),
)
